-- Add new fields to forms table for enhanced form metadata
-- Migration: Add label, time_to_complete, and priority_level to forms table

ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS label text,
ADD COLUMN IF NOT EXISTS time_to_complete integer,
ADD COLUMN IF NOT EXISTS priority_level text DEFAULT 'medium';

-- Add check constraint for priority_level to ensure valid values
ALTER TABLE public.forms 
ADD CONSTRAINT forms_priority_level_check 
CHECK (priority_level IN ('low', 'medium', 'high', 'urgent'));

-- Add check constraint for time_to_complete to ensure positive values
ALTER TABLE public.forms 
ADD CONSTRAINT forms_time_to_complete_check 
CHECK (time_to_complete > 0);

-- Add comments for documentation
COMMENT ON COLUMN public.forms.label IS 'Label/category for the form (e.g., Health, Care, Assessment)';
COMMENT ON COLUMN public.forms.time_to_complete IS 'Estimated time to complete the form in minutes';
COMMENT ON COLUMN public.forms.priority_level IS 'Priority level: low, medium, high, urgent';
