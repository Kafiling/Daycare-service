-- Fix assign_patient_to_multiple_groups function to match the rule_config format
-- used by the UI.
--
-- The UI creates rules with this rule_config structure:
-- {
--   "forms": [
--     { "form_id": "uuid", "threshold": 10, "operator": "gte" }
--   ],
--   "logic_operator": "AND"
-- }
--
-- But the old function expected a completely different format with "weight",
-- "min_score", "max_score", and a top-level "operator". This mismatch caused
-- the assignment to never work.

CREATE OR REPLACE FUNCTION public.assign_patient_to_multiple_groups(patient_id_param text)
RETURNS jsonb AS $$
DECLARE
  patient_scores jsonb := '{}';
  rule_record record;
  current_patient record;
  new_memberships integer := 0;
  total_rules integer := 0;
  rule_config jsonb;
  forms_array jsonb;
  form_config jsonb;
  form_score decimal;
  form_threshold decimal;
  form_operator text;
  form_satisfied boolean;
  rule_satisfied boolean;
  logic_op text;
  forms_checked integer;
  forms_passed integer;
  latest_submission record;
BEGIN
  -- Get current patient info
  SELECT * INTO current_patient
  FROM public.patients
  WHERE id = patient_id_param;

  IF current_patient IS NULL THEN
    RETURN jsonb_build_object('error', 'Patient not found');
  END IF;

  -- Get all latest submissions per form for this patient
  SELECT jsonb_object_agg(
    form_id::text,
    jsonb_build_object(
      'score', total_evaluation_score,
      'submitted_at', submitted_at,
      'submission_id', id
    )
  ) INTO patient_scores
  FROM (
    SELECT DISTINCT ON (form_id)
      id,
      form_id,
      total_evaluation_score,
      submitted_at
    FROM public.submissions
    WHERE patient_id = patient_id_param
      AND total_evaluation_score IS NOT NULL
      AND form_id IS NOT NULL
    ORDER BY form_id, submitted_at DESC
  ) latest_scores;

  IF patient_scores IS NULL OR patient_scores = '{}'::jsonb THEN
    RETURN jsonb_build_object('error', 'No completed submissions found for patient');
  END IF;

  -- Loop through all active score_based assignment rules
  FOR rule_record IN
    SELECT * FROM public.group_assignment_rules
    WHERE is_active = true AND rule_type = 'score_based'
  LOOP
    total_rules := total_rules + 1;
    rule_satisfied := false;
    forms_checked := 0;
    forms_passed := 0;

    rule_config := rule_record.rule_config;
    forms_array := rule_config->'forms';
    logic_op := COALESCE(rule_config->>'logic_operator', 'AND');

    IF forms_array IS NULL OR jsonb_array_length(forms_array) = 0 THEN
      CONTINUE; -- Skip rules with no form conditions
    END IF;

    -- Evaluate each form condition
    FOR form_config IN SELECT * FROM jsonb_array_elements(forms_array)
    LOOP
      -- Skip form entries without a form_id
      IF form_config->>'form_id' IS NULL OR form_config->>'form_id' = '' THEN
        CONTINUE;
      END IF;

      forms_checked := forms_checked + 1;
      form_satisfied := false;
      form_threshold := COALESCE((form_config->>'threshold')::decimal, 0);
      form_operator := COALESCE(form_config->>'operator', 'gte');

      -- Check if we have a score for this form
      IF patient_scores ? (form_config->>'form_id') THEN
        form_score := ((patient_scores->(form_config->>'form_id'))->>'score')::decimal;

        -- Evaluate the per-form condition
        CASE form_operator
          WHEN 'gte' THEN form_satisfied := form_score >= form_threshold;
          WHEN 'gt'  THEN form_satisfied := form_score > form_threshold;
          WHEN 'lte' THEN form_satisfied := form_score <= form_threshold;
          WHEN 'lt'  THEN form_satisfied := form_score < form_threshold;
          WHEN 'eq'  THEN form_satisfied := form_score = form_threshold;
          ELSE form_satisfied := false;
        END CASE;
      ELSE
        -- Patient has no submission for this form; condition not met
        form_satisfied := false;
      END IF;

      IF form_satisfied THEN
        forms_passed := forms_passed + 1;
      END IF;
    END LOOP;

    -- Skip if no valid forms were checked
    IF forms_checked = 0 THEN
      CONTINUE;
    END IF;

    -- Combine form results using the logic operator
    IF logic_op = 'OR' THEN
      rule_satisfied := forms_passed > 0;
    ELSE
      -- Default to AND
      rule_satisfied := forms_passed = forms_checked;
    END IF;

    -- If rule is satisfied, add patient to the group
    IF rule_satisfied THEN
      -- Get a relevant submission_id for tracking
      SELECT id INTO latest_submission
      FROM public.submissions
      WHERE patient_id = patient_id_param
        AND total_evaluation_score IS NOT NULL
      ORDER BY submitted_at DESC
      LIMIT 1;

      INSERT INTO public.patient_group_memberships (
        patient_id,
        group_id,
        assigned_by_rule_id,
        assignment_reason,
        submission_id
      ) VALUES (
        patient_id_param,
        rule_record.group_id,
        rule_record.id,
        format('Auto-assigned by rule "%s" (passed %s/%s form conditions)', rule_record.name, forms_passed, forms_checked),
        latest_submission.id::text
      )
      ON CONFLICT (patient_id, group_id) DO NOTHING;

      -- Check if a new membership was actually created
      IF FOUND THEN
        new_memberships := new_memberships + 1;

        -- Record in the assignment history
        INSERT INTO public.patient_group_assignments (
          patient_id,
          old_group_id,
          new_group_id,
          assignment_reason,
          assigned_by_rule_id,
          submission_id
        ) VALUES (
          patient_id_param,
          NULL,
          rule_record.group_id,
          format('Added to group by rule "%s" (passed %s/%s form conditions)', rule_record.name, forms_passed, forms_checked),
          rule_record.id,
          latest_submission.id::text
        );
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Evaluated %s rules, added to %s new groups', total_rules, new_memberships),
    'patient_id', patient_id_param,
    'new_memberships', new_memberships,
    'total_rules_evaluated', total_rules
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'patient_id', patient_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update the trigger to actually call the assignment function
-- instead of just logging a notice
CREATE OR REPLACE FUNCTION public.trigger_group_assignment()
RETURNS trigger AS $$
DECLARE
  result jsonb;
BEGIN
  -- Only process INSERT and UPDATE operations
  IF TG_OP NOT IN ('INSERT', 'UPDATE') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Only process if total_evaluation_score is present
  IF NEW.total_evaluation_score IS NULL THEN
    RETURN NEW;
  END IF;

  -- Run the multi-group assignment for this patient
  SELECT public.assign_patient_to_multiple_groups(NEW.patient_id) INTO result;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the main operation
  RAISE WARNING 'Failed to trigger group assignment: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
