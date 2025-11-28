ALTER TABLE public.forms
ADD COLUMN recurrence_schedule jsonb DEFAULT '[]'::jsonb;
