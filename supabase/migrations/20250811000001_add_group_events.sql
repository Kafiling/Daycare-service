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

-- Add recurrence columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_events' AND column_name = 'is_recurring') THEN
        ALTER TABLE public.group_events ADD COLUMN is_recurring boolean DEFAULT false NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_events' AND column_name = 'recurrence_pattern') THEN
        ALTER TABLE public.group_events ADD COLUMN recurrence_pattern text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_events' AND column_name = 'recurrence_end_date') THEN
        ALTER TABLE public.group_events ADD COLUMN recurrence_end_date timestamp with time zone;
    END IF;
END
$$;

-- Create trigger for updated_at (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'group_events_updated_at' 
        AND tgrelid = 'public.group_events'::regclass
    ) THEN
        CREATE TRIGGER group_events_updated_at
            BEFORE UPDATE ON public.group_events
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END
$$;

-- Create indexes for better performance (only if they don't exist and columns exist)
DO $$
BEGIN
    -- Always create index on group_id
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'group_events_group_id_idx') THEN
        CREATE INDEX group_events_group_id_idx ON public.group_events(group_id);
    END IF;
    
    -- Always create index on event_datetime
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'group_events_event_datetime_idx') THEN
        CREATE INDEX group_events_event_datetime_idx ON public.group_events(event_datetime);
    END IF;
    
    -- Always create index on is_active
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'group_events_is_active_idx') THEN
        CREATE INDEX group_events_is_active_idx ON public.group_events(is_active);
    END IF;
    
    -- Only create index on is_recurring if the column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'group_events' AND column_name = 'is_recurring') 
       AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'group_events_is_recurring_idx') THEN
        CREATE INDEX group_events_is_recurring_idx ON public.group_events(is_recurring);
    END IF;
END
$$;

-- Add comments for documentation (only if the columns exist)
DO $$
BEGIN
    -- Always add comments for table and base columns
    COMMENT ON TABLE public.group_events IS 'Events scheduled for patient groups';
    COMMENT ON COLUMN public.group_events.title IS 'Title of the event';
    COMMENT ON COLUMN public.group_events.description IS 'Description of the event';
    COMMENT ON COLUMN public.group_events.event_datetime IS 'Date and time when the event is scheduled';
    COMMENT ON COLUMN public.group_events.is_active IS 'Whether the event is active or cancelled';
    
    -- Only add comments for recurrence columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_events' AND column_name = 'is_recurring') THEN
        COMMENT ON COLUMN public.group_events.is_recurring IS 'Whether the event repeats according to a pattern';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_events' AND column_name = 'recurrence_pattern') THEN
        COMMENT ON COLUMN public.group_events.recurrence_pattern IS 'Pattern for recurring events: daily, weekly, biweekly, monthly, yearly';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_events' AND column_name = 'recurrence_end_date') THEN
        COMMENT ON COLUMN public.group_events.recurrence_end_date IS 'Optional end date for recurring events';
    END IF;
END
$$;

-- Grant permissions
GRANT ALL ON public.group_events TO authenticated;
GRANT ALL ON public.group_events TO service_role;
