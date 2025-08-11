-- Migration to add group events
CREATE TABLE IF NOT EXISTS public.group_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid REFERENCES public.patient_groups(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    event_datetime timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create trigger for updated_at
CREATE TRIGGER group_events_updated_at
    BEFORE UPDATE ON public.group_events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX group_events_group_id_idx ON public.group_events(group_id);
CREATE INDEX group_events_event_datetime_idx ON public.group_events(event_datetime);
CREATE INDEX group_events_is_active_idx ON public.group_events(is_active);

-- Add comments for documentation
COMMENT ON TABLE public.group_events IS 'Events scheduled for patient groups';
COMMENT ON COLUMN public.group_events.title IS 'Title of the event';
COMMENT ON COLUMN public.group_events.description IS 'Description of the event';
COMMENT ON COLUMN public.group_events.event_datetime IS 'Date and time when the event is scheduled';
COMMENT ON COLUMN public.group_events.is_active IS 'Whether the event is active or cancelled';

-- Grant permissions
GRANT ALL ON public.group_events TO authenticated;
GRANT ALL ON public.group_events TO service_role;
