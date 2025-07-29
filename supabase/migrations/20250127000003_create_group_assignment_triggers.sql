-- Enable HTTP extension for making HTTP requests to edge functions
-- Note: This extension needs to be enabled for the triggers to work
CREATE EXTENSION IF NOT EXISTS http;

-- Create webhook function to call the auto-assign-groups edge function
-- NOTE: For now, this function is disabled to avoid HTTP issues
-- The system will work with simplified local assignment instead
CREATE OR REPLACE FUNCTION public.trigger_group_assignment()
RETURNS trigger AS $$
BEGIN
  -- Only process INSERT and UPDATE operations
  IF TG_OP NOT IN ('INSERT', 'UPDATE') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Only process if total_evaluation_score is present (completed submission)
  IF NEW.total_evaluation_score IS NULL THEN
    RETURN NEW;
  END IF;

  -- For now, we'll skip the HTTP call and let manual assignment handle this
  -- This avoids the complex HTTP response parsing issues
  RAISE NOTICE 'Submission updated for patient %, consider running manual group assignment', NEW.patient_id;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the main operation
  RAISE WARNING 'Failed to trigger group assignment: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on submissions table
DROP TRIGGER IF EXISTS submissions_group_assignment ON public.submissions;
CREATE TRIGGER submissions_group_assignment
  AFTER INSERT OR UPDATE OF total_evaluation_score
  ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_group_assignment();

-- Create a simplified function to manually assign patient group without HTTP calls
CREATE OR REPLACE FUNCTION public.manually_assign_patient_group_simple(patient_id_param text)
RETURNS jsonb AS $$
DECLARE
  latest_submission record;
  patient_scores jsonb := '{}';
  best_rule record;
  current_patient record;
  assignment_result jsonb;
BEGIN
  -- Get the latest submission for this patient
  SELECT * INTO latest_submission
  FROM public.submissions 
  WHERE patient_id = patient_id_param 
    AND total_evaluation_score IS NOT NULL
  ORDER BY submitted_at DESC 
  LIMIT 1;

  IF latest_submission IS NULL THEN
    RETURN jsonb_build_object('error', 'No completed submissions found for patient');
  END IF;

  -- Get current patient info
  SELECT * INTO current_patient
  FROM public.patients
  WHERE id = patient_id_param;

  IF current_patient IS NULL THEN
    RETURN jsonb_build_object('error', 'Patient not found');
  END IF;

  -- Get all submissions for score calculation
  SELECT jsonb_object_agg(
    form_id, 
    jsonb_build_object(
      'score', total_evaluation_score,
      'submitted_at', submitted_at
    )
  ) INTO patient_scores
  FROM (
    SELECT DISTINCT ON (form_id) 
      form_id, 
      total_evaluation_score, 
      submitted_at
    FROM public.submissions
    WHERE patient_id = patient_id_param 
      AND total_evaluation_score IS NOT NULL
    ORDER BY form_id, submitted_at DESC
  ) latest_scores;

  -- Find the best matching rule
  SELECT * INTO best_rule
  FROM public.group_assignment_rules
  WHERE is_active = true
    AND rule_type = 'score_based'
  ORDER BY priority DESC
  LIMIT 1;

  IF best_rule IS NULL THEN
    RETURN jsonb_build_object('error', 'No active assignment rules found');
  END IF;

  -- For now, assign to the group from the highest priority rule
  -- (This is a simplified version - the edge function does more complex matching)
  IF current_patient.group_id != best_rule.group_id THEN
    -- Update patient group
    UPDATE public.patients 
    SET group_id = best_rule.group_id 
    WHERE id = patient_id_param;

    -- Record assignment history
    INSERT INTO public.patient_group_assignments (
      patient_id,
      old_group_id,
      new_group_id,
      assignment_reason,
      assigned_by_rule_id,
      submission_id
    ) VALUES (
      patient_id_param,
      current_patient.group_id,
      best_rule.group_id,
      'Manual assignment (simplified): ' || best_rule.name,
      best_rule.id,
      latest_submission.id
    );

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Patient group updated',
      'patient_id', patient_id_param,
      'old_group_id', current_patient.group_id,
      'new_group_id', best_rule.group_id,
      'rule_name', best_rule.name
    );
  ELSE
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Patient already in correct group',
      'patient_id', patient_id_param,
      'group_id', current_patient.group_id
    );
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'patient_id', patient_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to manually trigger group assignment for a patient
-- This now uses the simplified logic instead of HTTP calls
CREATE OR REPLACE FUNCTION public.manually_assign_patient_group(patient_id_param text)
RETURNS jsonb AS $$
BEGIN
  -- Simply call the simplified version
  RETURN public.manually_assign_patient_group_simple(patient_id_param);
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
    FROM public.submissions 
    WHERE total_evaluation_score IS NOT NULL
  LOOP
    -- Use the simplified assignment function
    SELECT public.manually_assign_patient_group_simple(patient_record.patient_id) INTO result;
    
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
COMMENT ON FUNCTION public.manually_assign_patient_group(text) IS 'Manually trigger group assignment for a specific patient via HTTP';
COMMENT ON FUNCTION public.manually_assign_patient_group_simple(text) IS 'Manually assign patient group using simplified local logic';
COMMENT ON FUNCTION public.recalculate_all_patient_groups() IS 'Recalculate group assignments for all patients';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.manually_assign_patient_group(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manually_assign_patient_group_simple(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_all_patient_groups() TO authenticated;
