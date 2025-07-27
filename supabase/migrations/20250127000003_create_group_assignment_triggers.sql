-- Create webhook function to call the auto-assign-groups edge function
CREATE OR REPLACE FUNCTION public.trigger_group_assignment()
RETURNS trigger AS $$
DECLARE
  webhook_url text;
  payload jsonb;
  http_request_id bigint;
BEGIN
  -- Only process INSERT and UPDATE operations
  IF TG_OP NOT IN ('INSERT', 'UPDATE') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Only process if total_score is present (completed submission)
  IF NEW.total_score IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the webhook URL from environment or use local development URL
  webhook_url := coalesce(
    current_setting('app.supabase_functions_url', true),
    'http://127.0.0.1:54321/functions/v1'
  ) || '/auto-assign-groups';

  -- Prepare the payload
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW)
  );

  -- Add old record for UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    payload := payload || jsonb_build_object('old_record', row_to_json(OLD));
  END IF;

  -- Make HTTP request to the edge function
  -- Note: This uses the http extension which needs to be enabled
  SELECT http_post(
    webhook_url,
    payload::text,
    'application/json'
  ) INTO http_request_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the main operation
  RAISE WARNING 'Failed to trigger group assignment: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on form_submissions table
DROP TRIGGER IF EXISTS form_submissions_group_assignment ON public.form_submissions;
CREATE TRIGGER form_submissions_group_assignment
  AFTER INSERT OR UPDATE OF total_score
  ON public.form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_group_assignment();

-- Create a function to manually trigger group assignment for a patient
CREATE OR REPLACE FUNCTION public.manually_assign_patient_group(patient_id_param text)
RETURNS jsonb AS $$
DECLARE
  webhook_url text;
  payload jsonb;
  latest_submission record;
  http_request_id bigint;
BEGIN
  -- Get the latest submission for this patient
  SELECT * INTO latest_submission
  FROM public.form_submissions 
  WHERE patient_id = patient_id_param 
    AND total_score IS NOT NULL
  ORDER BY submitted_at DESC 
  LIMIT 1;

  IF latest_submission IS NULL THEN
    RETURN jsonb_build_object('error', 'No completed submissions found for patient');
  END IF;

  -- Get the webhook URL
  webhook_url := coalesce(
    current_setting('app.supabase_functions_url', true),
    'http://127.0.0.1:54321/functions/v1'
  ) || '/auto-assign-groups';

  -- Prepare the payload
  payload := jsonb_build_object(
    'type', 'UPDATE',
    'table', 'form_submissions',
    'record', row_to_json(latest_submission)
  );

  -- Make HTTP request to the edge function
  SELECT http_post(
    webhook_url,
    payload::text,
    'application/json'
  ) INTO http_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Group assignment triggered',
    'patient_id', patient_id_param,
    'submission_id', latest_submission.id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'patient_id', patient_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to recalculate all patient groups
CREATE OR REPLACE FUNCTION public.recalculate_all_patient_groups()
RETURNS jsonb AS $$
DECLARE
  patient_record record;
  result_count integer := 0;
  error_count integer := 0;
  result jsonb;
BEGIN
  -- Loop through all patients with completed submissions
  FOR patient_record IN 
    SELECT DISTINCT patient_id 
    FROM public.form_submissions 
    WHERE total_score IS NOT NULL
  LOOP
    -- Trigger assignment for each patient
    SELECT public.manually_assign_patient_group(patient_record.patient_id) INTO result;
    
    IF result->>'error' IS NULL THEN
      result_count := result_count + 1;
    ELSE
      error_count := error_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'processed', result_count,
    'errors', error_count,
    'message', format('Processed %s patients with %s errors', result_count, error_count)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'processed', result_count,
    'errors', error_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION public.trigger_group_assignment() IS 'Trigger function to call auto-assign-groups edge function when submissions are updated';
COMMENT ON FUNCTION public.manually_assign_patient_group(text) IS 'Manually trigger group assignment for a specific patient';
COMMENT ON FUNCTION public.recalculate_all_patient_groups() IS 'Recalculate group assignments for all patients';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.manually_assign_patient_group(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_all_patient_groups() TO authenticated;
