-- Migration to support multiple group memberships and remove priority system
-- This changes the system from single group assignment to multiple group memberships

-- First, create a new table for patient group memberships (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.patient_group_memberships (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id text NOT NULL,
    group_id uuid REFERENCES public.patient_groups(id) ON DELETE CASCADE NOT NULL,
    assigned_by_rule_id uuid REFERENCES public.group_assignment_rules(id) ON DELETE SET NULL,
    assignment_reason text,
    submission_id text, -- Reference to the submission that triggered the membership
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure a patient can only be in a group once
    UNIQUE(patient_id, group_id)
);

-- Create indexes for better performance
CREATE INDEX patient_group_memberships_patient_id_idx ON public.patient_group_memberships(patient_id);
CREATE INDEX patient_group_memberships_group_id_idx ON public.patient_group_memberships(group_id);
CREATE INDEX patient_group_memberships_created_at_idx ON public.patient_group_memberships(created_at DESC);

-- Migrate existing data from patients.group_id to the new memberships table
INSERT INTO public.patient_group_memberships (patient_id, group_id, assignment_reason)
SELECT 
    p.id, 
    p.group_id, 
    'Migrated from existing group assignment'
FROM public.patients p
WHERE p.group_id IS NOT NULL
ON CONFLICT (patient_id, group_id) DO NOTHING;

-- Remove priority column from group_assignment_rules since we're not using priority anymore
ALTER TABLE public.group_assignment_rules DROP COLUMN IF EXISTS priority;

-- Update the group assignment rules table to remove priority-based logic
-- and make it focus on simple threshold matching

-- Create updated function for multiple group assignment
CREATE OR REPLACE FUNCTION public.assign_patient_to_multiple_groups(patient_id_param text)
RETURNS jsonb AS $$
DECLARE
  latest_submission record;
  patient_scores jsonb := '{}';
  rule_record record;
  current_patient record;
  new_memberships integer := 0;
  total_rules integer := 0;
  rule_config jsonb;
  forms_array jsonb;
  form_config jsonb;
  calculated_score decimal := 0;
  form_score decimal;
  rule_satisfied boolean;
  min_score decimal;
  max_score decimal;
  operator_type text;
BEGIN
  -- Get current patient info
  SELECT * INTO current_patient
  FROM public.patients
  WHERE id = patient_id_param;

  IF current_patient IS NULL THEN
    RETURN jsonb_build_object('error', 'Patient not found');
  END IF;

  -- Get all latest submissions for score calculation
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

  IF patient_scores = '{}' THEN
    RETURN jsonb_build_object('error', 'No completed submissions found for patient');
  END IF;

  -- Loop through all active assignment rules
  FOR rule_record IN 
    SELECT * FROM public.group_assignment_rules 
    WHERE is_active = true AND rule_type = 'score_based'
  LOOP
    total_rules := total_rules + 1;
    rule_satisfied := false;
    calculated_score := 0;
    
    rule_config := rule_record.rule_config;
    forms_array := rule_config->'forms';
    min_score := (rule_config->>'min_score')::decimal;
    max_score := (rule_config->>'max_score')::decimal;
    operator_type := rule_config->>'operator';
    
    -- Calculate weighted score for this rule
    IF forms_array IS NOT NULL THEN
      FOR form_config IN SELECT * FROM jsonb_array_elements(forms_array)
      LOOP
        IF patient_scores ? (form_config->>'form_id') THEN
          form_score := ((patient_scores->(form_config->>'form_id'))->>'score')::decimal;
          calculated_score := calculated_score + (form_score * (form_config->>'weight')::decimal);
        END IF;
      END LOOP;
    END IF;
    
    -- Check if the rule is satisfied
    CASE operator_type
      WHEN 'gte' THEN
        rule_satisfied := calculated_score >= COALESCE(min_score, 0);
      WHEN 'lte' THEN
        rule_satisfied := calculated_score <= COALESCE(max_score, 100);
      WHEN 'between' THEN
        rule_satisfied := calculated_score >= COALESCE(min_score, 0) AND calculated_score <= COALESCE(max_score, 100);
      WHEN 'eq' THEN
        rule_satisfied := calculated_score = COALESCE(min_score, 0);
      ELSE
        rule_satisfied := false;
    END CASE;
    
    -- If rule is satisfied and patient is not already in this group, add them
    IF rule_satisfied THEN
      INSERT INTO public.patient_group_memberships (
        patient_id,
        group_id,
        assigned_by_rule_id,
        assignment_reason
      ) VALUES (
        patient_id_param,
        rule_record.group_id,
        rule_record.id,
        format('Auto-assigned by rule "%s" (score: %s)', rule_record.name, calculated_score)
      )
      ON CONFLICT (patient_id, group_id) DO NOTHING;
      
      -- Check if a new membership was actually created
      IF FOUND THEN
        new_memberships := new_memberships + 1;
        
        -- Also record in the assignment history
        INSERT INTO public.patient_group_assignments (
          patient_id,
          old_group_id,
          new_group_id,
          assignment_reason,
          assigned_by_rule_id
        ) VALUES (
          patient_id_param,
          NULL, -- No old group since this is additive
          rule_record.group_id,
          format('Added to group by rule "%s" (score: %s)', rule_record.name, calculated_score),
          rule_record.id
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

-- Update the manually_assign_patient_group function to use the new multi-group logic
CREATE OR REPLACE FUNCTION public.manually_assign_patient_group_simple(patient_id_param text)
RETURNS jsonb AS $$
BEGIN
  RETURN public.assign_patient_to_multiple_groups(patient_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the manually_assign_patient_group function
CREATE OR REPLACE FUNCTION public.manually_assign_patient_group(patient_id_param text)
RETURNS jsonb AS $$
BEGIN
  RETURN public.assign_patient_to_multiple_groups(patient_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the recalculate function to work with multiple groups
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
    -- Use the new multi-group assignment function
    SELECT public.assign_patient_to_multiple_groups(patient_record.patient_id) INTO result;
    
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

-- Function to remove a patient from a specific group
CREATE OR REPLACE FUNCTION public.remove_patient_from_group(patient_id_param text, group_id_param uuid)
RETURNS jsonb AS $$
BEGIN
  DELETE FROM public.patient_group_memberships
  WHERE patient_id = patient_id_param AND group_id = group_id_param;
  
  IF FOUND THEN
    -- Record the removal in assignment history
    INSERT INTO public.patient_group_assignments (
      patient_id,
      old_group_id,
      new_group_id,
      assignment_reason
    ) VALUES (
      patient_id_param,
      group_id_param,
      NULL,
      'Manual removal from group'
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Patient removed from group',
      'patient_id', patient_id_param,
      'group_id', group_id_param
    );
  ELSE
    RETURN jsonb_build_object(
      'error', 'Patient was not a member of this group',
      'patient_id', patient_id_param,
      'group_id', group_id_param
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'patient_id', patient_id_param,
    'group_id', group_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE public.patient_group_memberships IS 'Many-to-many relationship table for patient group memberships';
COMMENT ON FUNCTION public.assign_patient_to_multiple_groups(text) IS 'Assign patient to all groups they qualify for based on active rules';
COMMENT ON FUNCTION public.remove_patient_from_group(text, uuid) IS 'Remove a patient from a specific group';

-- Grant permissions
GRANT ALL ON public.patient_group_memberships TO authenticated;
GRANT ALL ON public.patient_group_memberships TO service_role;
GRANT EXECUTE ON FUNCTION public.assign_patient_to_multiple_groups(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_patient_from_group(text, uuid) TO authenticated;
