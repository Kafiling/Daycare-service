-- Add logic_operator field to group_assignment_rules to support AND/OR conditions
-- This allows rules to specify whether all conditions must be met (AND) or any condition (OR)

-- The logic_operator will be stored in the rule_config JSONB
-- We don't need to add a new column, just document the expected structure

-- Expected rule_config structure for score_based rules:
-- {
--   "forms": [{"form_id": "uuid", "threshold": 50, "operator": "gte|lte|gt|lt|eq"}],
--   "logic_operator": "AND|OR"  -- determines how multiple form conditions are combined
-- }
--
-- Each form is evaluated independently:
-- - Form1: score >= threshold1
-- - Form2: score < threshold2
-- Then combined: (Form1 condition) AND/OR (Form2 condition)

-- Add a comment to document the new structure
COMMENT ON COLUMN public.group_assignment_rules.rule_config IS 
'JSONB configuration for the rule. For score_based rules: {forms: [{form_id, threshold, operator: "gte|lte|gt|lt|eq"}], logic_operator: "AND|OR"}. Each form has its own threshold and comparison operator. The logic_operator determines if all form conditions must be met (AND) or any one condition (OR).';

-- Update existing rules to have default logic_operator = 'AND'
-- This ensures backward compatibility with existing rules
UPDATE public.group_assignment_rules
SET rule_config = jsonb_set(
  rule_config,
  '{logic_operator}',
  '"AND"'::jsonb,
  true
)
WHERE rule_config->>'logic_operator' IS NULL
AND rule_type = 'score_based';
