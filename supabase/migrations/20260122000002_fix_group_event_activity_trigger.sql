-- Fix log_group_event_activity function to use 'title' instead of 'event_name'
-- The group_events table has a 'title' column, not 'event_name'

CREATE OR REPLACE FUNCTION public.log_group_event_activity()
RETURNS trigger AS $$
DECLARE
    v_group_name text;
BEGIN
    -- Get group name
    IF (TG_OP = 'DELETE') THEN
        SELECT name INTO v_group_name
        FROM public.patient_groups
        WHERE id = OLD.group_id;
    ELSE
        SELECT name INTO v_group_name
        FROM public.patient_groups
        WHERE id = NEW.group_id;
    END IF;
    
    IF (TG_OP = 'INSERT') THEN
        PERFORM public.log_activity(
            'event_created',
            'group_event',
            NEW.id::text,
            auth.uid(),
            'สร้างกิจกรรมกลุ่มใหม่: ' || NEW.title || ' (' || v_group_name || ')',
            jsonb_build_object(
                'event_id', NEW.id,
                'title', NEW.title,
                'group_id', NEW.group_id,
                'group_name', v_group_name,
                'event_datetime', NEW.event_datetime,
                'location', NEW.location
            )
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        PERFORM public.log_activity(
            'event_updated',
            'group_event',
            NEW.id::text,
            auth.uid(),
            'อัปเดตกิจกรรมกลุ่ม: ' || NEW.title || ' (' || v_group_name || ')',
            jsonb_build_object(
                'event_id', NEW.id,
                'title', NEW.title,
                'group_id', NEW.group_id,
                'group_name', v_group_name,
                'old_title', OLD.title,
                'old_event_datetime', OLD.event_datetime,
                'new_event_datetime', NEW.event_datetime
            )
        );
    ELSIF (TG_OP = 'DELETE') THEN
        PERFORM public.log_activity(
            'event_deleted',
            'group_event',
            OLD.id::text,
            auth.uid(),
            'ลบกิจกรรมกลุ่ม: ' || OLD.title || ' (' || v_group_name || ')',
            jsonb_build_object(
                'event_id', OLD.id,
                'title', OLD.title,
                'group_id', OLD.group_id,
                'group_name', v_group_name,
                'event_datetime', OLD.event_datetime
            )
        );
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS log_group_event_activity_trigger ON public.group_events;
CREATE TRIGGER log_group_event_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.group_events
    FOR EACH ROW
    EXECUTE FUNCTION public.log_group_event_activity();
