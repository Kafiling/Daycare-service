-- Add location column to group_events table
ALTER TABLE public.group_events
ADD COLUMN location text NULL;

-- Add index for location searches (optional, but useful for filtering)
CREATE INDEX IF NOT EXISTS group_events_location_idx ON public.group_events USING btree (location) TABLESPACE pg_default;

-- Add comment to describe the column
COMMENT ON COLUMN public.group_events.location IS 'Location where the event will be held';
