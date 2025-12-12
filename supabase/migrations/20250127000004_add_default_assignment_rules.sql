-- Create default assignment rules for group assignment system
-- This ensures the system has working rules even without manual configuration

-- Insert default assignment rules (only if they don't exist)
DO $$
DECLARE
    emergency_group_id uuid;
    special_group_id uuid;
    general_group_id uuid;
BEGIN
    -- Get group IDs first and check if they exist
    SELECT id INTO emergency_group_id FROM public.patient_groups WHERE name = 'ฉุกเฉิน' LIMIT 1;
    SELECT id INTO special_group_id FROM public.patient_groups WHERE name = 'ติดตามพิเศษ' LIMIT 1;
    SELECT id INTO general_group_id FROM public.patient_groups WHERE name = 'ทั่วไป' LIMIT 1;
    
    -- Debug output
    RAISE NOTICE 'Emergency group ID: %', emergency_group_id;
    RAISE NOTICE 'Special group ID: %', special_group_id;
    RAISE NOTICE 'General group ID: %', general_group_id;
    
    -- Only proceed if all groups exist
    IF emergency_group_id IS NOT NULL AND special_group_id IS NOT NULL AND general_group_id IS NOT NULL THEN
        -- Check if any rules already exist
        IF NOT EXISTS (SELECT 1 FROM public.group_assignment_rules WHERE name IN ('ผู้ใช้บริการเสี่ยงสูง', 'ผู้ใช้บริการเสี่ยงปานกลาง', 'ผู้ใช้บริการเสี่ยงต่ำ')) THEN
            INSERT INTO public.group_assignment_rules (
                name,
                description,
                group_id,
                rule_type,
                rule_config,
                priority,
                is_active
            ) VALUES 
            -- Rule 1: High risk patients (score >= 80) go to Emergency group
            (
                'ผู้ใช้บริการเสี่ยงสูง',
                'ผู้ใช้บริการที่มีคะแนนประเมินสูง ต้องการการดูแลเป็นพิเศษ',
                emergency_group_id,
                'score_based',
                jsonb_build_object(
                    'operator', 'gte',
                    'min_score', 80,
                    'forms', jsonb_build_array()
                ),
                100,
                true
            ),
            -- Rule 2: Medium risk patients (score 50-79) go to Special Follow-up group  
            (
                'ผู้ใช้บริการเสี่ยงปานกลาง',
                'ผู้ใช้บริการที่มีคะแนนประเมินปานกลาง ต้องติดตามเป็นพิเศษ',
                special_group_id,
                'score_based',
                jsonb_build_object(
                    'operator', 'between',
                    'min_score', 50,
                    'max_score', 79,
                    'forms', jsonb_build_array()
                ),
                80,
                true
            ),
            -- Rule 3: Low risk patients (score < 50) go to General group
            (
                'ผู้ใช้บริการเสี่ยงต่ำ',
                'ผู้ใช้บริการที่มีคะแนนประเมินต่ำ อยู่ในกลุ่มทั่วไป',
                general_group_id,
                'score_based',
                jsonb_build_object(
                    'operator', 'lte',
                    'min_score', 49,
                    'forms', jsonb_build_array()
                ),
                60,
                true
            );
            
            RAISE NOTICE 'Successfully created default assignment rules';
        ELSE
            RAISE NOTICE 'Assignment rules already exist, skipping creation';
        END IF;
    ELSE
        RAISE WARNING 'Cannot create assignment rules: Required patient groups not found. Please ensure groups "ฉุกเฉิน", "ติดตามพิเศษ", and "ทั่วไป" exist.';
    END IF;
END $$;

-- Update the simplified assignment function to handle score-based assignment
CREATE OR REPLACE FUNCTION public.manually_assign_patient_group_simple(patient_id_param text)
RETURNS jsonb AS $$
DECLARE
  latest_submission record;
  patient_scores jsonb := '{}';
  best_rule record;
  current_patient record;
  assignment_result jsonb;
  avg_score numeric := 0;
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

  -- Calculate average score from all submissions for this patient
  SELECT COALESCE(AVG(total_evaluation_score), 0) INTO avg_score
  FROM public.submissions
  WHERE patient_id = patient_id_param 
    AND total_evaluation_score IS NOT NULL;

  RAISE NOTICE 'Patient % has average score: %', patient_id_param, avg_score;

  -- Find the best matching rule based on score
  SELECT * INTO best_rule
  FROM public.group_assignment_rules
  WHERE is_active = true
    AND rule_type = 'score_based'
    AND (
      (rule_config->>'operator' = 'gte' AND avg_score >= COALESCE((rule_config->>'min_score')::numeric, 0)) OR
      (rule_config->>'operator' = 'lte' AND avg_score <= COALESCE((rule_config->>'min_score')::numeric, 100)) OR
      (rule_config->>'operator' = 'between' AND avg_score >= COALESCE((rule_config->>'min_score')::numeric, 0) AND avg_score <= COALESCE((rule_config->>'max_score')::numeric, 100))
    )
  ORDER BY priority DESC
  LIMIT 1;

  -- If no rule found, assign to default group (General)
  IF best_rule IS NULL THEN
    SELECT * INTO best_rule
    FROM public.group_assignment_rules
    WHERE is_active = true
      AND rule_type = 'score_based'
    ORDER BY priority ASC  -- Get lowest priority as fallback
    LIMIT 1;
    
    -- If still no rule, assign to General group directly
    IF best_rule IS NULL THEN
      -- Create a temporary record for default assignment
      best_rule.id := NULL;
      best_rule.name := 'Default Assignment';
      SELECT id INTO best_rule.group_id FROM public.patient_groups WHERE name = 'ทั่วไป' LIMIT 1;
      
      -- If General group doesn't exist, use the first available group
      IF best_rule.group_id IS NULL THEN
        SELECT id INTO best_rule.group_id FROM public.patient_groups ORDER BY created_at ASC LIMIT 1;
        best_rule.name := 'Fallback Assignment';
      END IF;
    END IF;
  END IF;

  RAISE NOTICE 'Selected rule: % for group: %', best_rule.name, best_rule.group_id;

  -- Assign to group if different
  IF current_patient.group_id IS DISTINCT FROM best_rule.group_id THEN
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
      'Auto assignment (score: ' || round(avg_score, 1) || '): ' || COALESCE(best_rule.name, 'Default'),
      best_rule.id,
      latest_submission.id
    );

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Patient group updated',
      'patient_id', patient_id_param,
      'old_group_id', current_patient.group_id,
      'new_group_id', best_rule.group_id,
      'rule_name', COALESCE(best_rule.name, 'Default'),
      'avg_score', avg_score
    );
  ELSE
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Patient already in correct group',
      'patient_id', patient_id_param,
      'group_id', current_patient.group_id,
      'avg_score', avg_score
    );
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'patient_id', patient_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
