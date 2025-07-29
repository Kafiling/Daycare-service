-- Create group assignment thresholds table
CREATE TABLE IF NOT EXISTS public.group_assignment_thresholds (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid REFERENCES public.patient_groups(id) ON DELETE CASCADE NOT NULL,
    form_id text NOT NULL,
    weight decimal(5,2) DEFAULT 1.0 NOT NULL CHECK (weight > 0),
    min_score decimal(10,2),
    max_score decimal(10,2),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure min_score <= max_score if both are provided
    CONSTRAINT valid_score_range CHECK (
        (min_score IS NULL OR max_score IS NULL) OR (min_score <= max_score)
    )
);

-- Create trigger for updated_at
CREATE TRIGGER group_assignment_thresholds_updated_at
    BEFORE UPDATE ON public.group_assignment_thresholds
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create unique index to prevent duplicate form assignments to same group
CREATE UNIQUE INDEX group_assignment_thresholds_unique_form_group 
ON public.group_assignment_thresholds(group_id, form_id) 
WHERE is_active = true;

-- Create group assignment rules table for more complex logic
CREATE TABLE IF NOT EXISTS public.group_assignment_rules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    group_id uuid REFERENCES public.patient_groups(id) ON DELETE CASCADE NOT NULL,
    rule_type text NOT NULL CHECK (rule_type IN ('score_based', 'form_completion', 'time_based')),
    rule_config jsonb NOT NULL DEFAULT '{}',
    priority integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create trigger for updated_at
CREATE TRIGGER group_assignment_rules_updated_at
    BEFORE UPDATE ON public.group_assignment_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create assignment history table to track changes
CREATE TABLE IF NOT EXISTS public.patient_group_assignments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id text NOT NULL,
    old_group_id uuid REFERENCES public.patient_groups(id) ON DELETE SET NULL,
    new_group_id uuid REFERENCES public.patient_groups(id) ON DELETE SET NULL,
    assignment_reason text,
    assigned_by_rule_id uuid REFERENCES public.group_assignment_rules(id) ON DELETE SET NULL,
    submission_id text, -- Reference to the submission that triggered the assignment
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX group_assignment_thresholds_group_id_idx ON public.group_assignment_thresholds(group_id);
CREATE INDEX group_assignment_thresholds_form_id_idx ON public.group_assignment_thresholds(form_id);
CREATE INDEX group_assignment_rules_group_id_idx ON public.group_assignment_rules(group_id);
CREATE INDEX group_assignment_rules_priority_idx ON public.group_assignment_rules(priority DESC);
CREATE INDEX patient_group_assignments_patient_id_idx ON public.patient_group_assignments(patient_id);
CREATE INDEX patient_group_assignments_created_at_idx ON public.patient_group_assignments(created_at DESC);

-- Insert some example threshold configurations
INSERT INTO public.group_assignment_rules (name, description, group_id, rule_type, rule_config, priority) 
SELECT 
    'High Risk Assessment',
    'Patients with high scores on assessment forms',
    pg.id,
    'score_based',
    jsonb_build_object(
        'forms', jsonb_build_array(
            jsonb_build_object('form_id', 'health-assessment', 'weight', 1.0, 'threshold', 80)
        ),
        'min_score', 80,
        'operator', 'gte'
    ),
    1
FROM public.patient_groups pg WHERE pg.name = 'ติดตามพิเศษ'
ON CONFLICT DO NOTHING;

INSERT INTO public.group_assignment_rules (name, description, group_id, rule_type, rule_config, priority) 
SELECT 
    'Emergency Care Required',
    'Patients requiring immediate attention',
    pg.id,
    'score_based',
    jsonb_build_object(
        'forms', jsonb_build_array(
            jsonb_build_object('form_id', 'emergency-assessment', 'weight', 2.0, 'threshold', 70),
            jsonb_build_object('form_id', 'health-assessment', 'weight', 1.0, 'threshold', 90)
        ),
        'min_score', 75,
        'operator', 'gte'
    ),
    2
FROM public.patient_groups pg WHERE pg.name = 'ฉุกเฉิน'
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE public.group_assignment_thresholds IS 'Configuration for automatic patient group assignment based on form scores';
COMMENT ON TABLE public.group_assignment_rules IS 'Complex rules for patient group assignment with priority support';
COMMENT ON TABLE public.patient_group_assignments IS 'History of patient group assignments for audit trail';

COMMENT ON COLUMN public.group_assignment_thresholds.weight IS 'Weight multiplier for this form score in group assignment calculation';
COMMENT ON COLUMN public.group_assignment_thresholds.min_score IS 'Minimum score threshold for assignment to this group';
COMMENT ON COLUMN public.group_assignment_thresholds.max_score IS 'Maximum score threshold for assignment to this group';

COMMENT ON COLUMN public.group_assignment_rules.rule_type IS 'Type of assignment rule: score_based, form_completion, time_based';
COMMENT ON COLUMN public.group_assignment_rules.rule_config IS 'JSON configuration for the rule logic';
COMMENT ON COLUMN public.group_assignment_rules.priority IS 'Rule priority (higher number = higher priority)';

-- Grant permissions
GRANT ALL ON public.group_assignment_thresholds TO authenticated;
GRANT ALL ON public.group_assignment_rules TO authenticated;
GRANT ALL ON public.patient_group_assignments TO authenticated;
GRANT ALL ON public.group_assignment_thresholds TO service_role;
GRANT ALL ON public.group_assignment_rules TO service_role;
GRANT ALL ON public.patient_group_assignments TO service_role;
