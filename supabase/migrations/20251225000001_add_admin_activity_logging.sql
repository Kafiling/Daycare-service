-- Migration to add activity logging for admin actions
-- This migration adds triggers and functions to track admin activities like data exports

-- Add new activity types for admin actions
COMMENT ON COLUMN public.activity_logs.activity_type IS 'Type of activity performed (e.g., survey_submitted, patient_created, admin_export_data, admin_login, etc)';

-- Function to log admin export activity
-- This should be called from the Edge Function or application code
CREATE OR REPLACE FUNCTION public.log_admin_export(
    p_performed_by uuid,
    p_export_type text DEFAULT 'full_export',
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
    v_log_id uuid;
    v_user_name text;
BEGIN
    -- Get user name from profiles
    SELECT COALESCE(first_name || ' ' || last_name, username)
    INTO v_user_name
    FROM public.profiles
    WHERE id = p_performed_by;
    
    -- Insert activity log
    INSERT INTO public.activity_logs (
        activity_type,
        entity_type,
        entity_id,
        performed_by,
        performed_by_name,
        description,
        metadata
    ) VALUES (
        'admin_export_data',
        'admin_action',
        p_performed_by::text,
        p_performed_by,
        v_user_name,
        'ส่งออกข้อมูล Excel โดยผู้ดูแลระบบ',
        jsonb_build_object(
            'export_type', p_export_type,
            'timestamp', now()
        ) || COALESCE(p_metadata, '{}'::jsonb)
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the new function
GRANT EXECUTE ON FUNCTION public.log_admin_export(uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_export(uuid, text, jsonb) TO service_role;

-- Function to log general admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
    p_activity_type text,
    p_entity_type text,
    p_entity_id text,
    p_performed_by uuid,
    p_description text,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
    v_log_id uuid;
BEGIN
    -- Use the existing log_activity function but ensure it's for admin actions
    v_log_id := public.log_activity(
        p_activity_type,
        p_entity_type,
        p_entity_id,
        p_performed_by,
        p_description,
        p_metadata
    );
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, text, text, uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, text, text, uuid, text, jsonb) TO service_role;

-- Update the log_form_activity to ensure created_by is properly tracked
CREATE OR REPLACE FUNCTION public.log_form_activity()
RETURNS trigger AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get the current user ID
    v_user_id := auth.uid();
    
    IF (TG_OP = 'INSERT') THEN
        PERFORM public.log_activity(
            'survey_created',
            'survey',
            NEW.form_id::text,
            COALESCE(NEW.created_by, v_user_id),
            'สร้างแบบสอบถามใหม่: ' || NEW.title,
            jsonb_build_object(
                'survey_id', NEW.form_id,
                'title', NEW.title,
                'label', NEW.label,
                'created_by', COALESCE(NEW.created_by, v_user_id)
            )
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        PERFORM public.log_activity(
            'survey_updated',
            'survey',
            NEW.form_id::text,
            v_user_id,
            'อัปเดตแบบสอบถาม: ' || NEW.title,
            jsonb_build_object(
                'survey_id', NEW.form_id,
                'title', NEW.title,
                'updated_by', v_user_id,
                'changes', jsonb_build_object(
                    'old_title', OLD.title,
                    'new_title', NEW.title
                )
            )
        );
    ELSIF (TG_OP = 'DELETE') THEN
        PERFORM public.log_activity(
            'survey_deleted',
            'survey',
            OLD.form_id::text,
            v_user_id,
            'ลบแบบสอบถาม: ' || OLD.title,
            jsonb_build_object(
                'survey_id', OLD.form_id,
                'title', OLD.title,
                'deleted_by', v_user_id
            )
        );
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update patient group trigger to track user properly
CREATE OR REPLACE FUNCTION public.log_patient_group_activity()
RETURNS trigger AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    
    IF (TG_OP = 'INSERT') THEN
        PERFORM public.log_activity(
            'group_created',
            'patient_group',
            NEW.id::text,
            v_user_id,
            'สร้างกลุ่มผู้ใช้บริการใหม่: ' || NEW.name,
            jsonb_build_object(
                'group_id', NEW.id,
                'name', NEW.name,
                'description', NEW.description,
                'created_by', v_user_id
            )
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        PERFORM public.log_activity(
            'group_updated',
            'patient_group',
            NEW.id::text,
            v_user_id,
            'อัปเดตกลุ่มผู้ใช้บริการ: ' || NEW.name,
            jsonb_build_object(
                'group_id', NEW.id,
                'name', NEW.name,
                'updated_by', v_user_id,
                'changes', jsonb_build_object(
                    'old_name', OLD.name,
                    'new_name', NEW.name
                )
            )
        );
    ELSIF (TG_OP = 'DELETE') THEN
        PERFORM public.log_activity(
            'group_deleted',
            'patient_group',
            OLD.id::text,
            v_user_id,
            'ลบกลุ่มผู้ใช้บริการ: ' || OLD.name,
            jsonb_build_object(
                'group_id', OLD.id,
                'name', OLD.name,
                'deleted_by', v_user_id
            )
        );
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update group event trigger to track user properly
CREATE OR REPLACE FUNCTION public.log_group_event_activity()
RETURNS trigger AS $$
DECLARE
    v_group_name text;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    
    -- Get group name
    SELECT name INTO v_group_name
    FROM public.patient_groups
    WHERE id = NEW.group_id;
    
    IF (TG_OP = 'INSERT') THEN
        PERFORM public.log_activity(
            'event_created',
            'group_event',
            NEW.id::text,
            v_user_id,
            'สร้างกิจกรรมกลุ่มใหม่: ' || NEW.event_name || ' (' || v_group_name || ')',
            jsonb_build_object(
                'event_id', NEW.id,
                'event_name', NEW.event_name,
                'group_id', NEW.group_id,
                'group_name', v_group_name,
                'event_datetime', NEW.event_datetime,
                'created_by', v_user_id
            )
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        PERFORM public.log_activity(
            'event_updated',
            'group_event',
            NEW.id::text,
            v_user_id,
            'อัปเดตกิจกรรมกลุ่ม: ' || NEW.event_name || ' (' || v_group_name || ')',
            jsonb_build_object(
                'event_id', NEW.id,
                'event_name', NEW.event_name,
                'group_name', v_group_name,
                'updated_by', v_user_id
            )
        );
    ELSIF (TG_OP = 'DELETE') THEN
        PERFORM public.log_activity(
            'event_deleted',
            'group_event',
            OLD.id::text,
            v_user_id,
            'ลบกิจกรรมกลุ่ม: ' || OLD.event_name || ' (' || v_group_name || ')',
            jsonb_build_object(
                'event_id', OLD.id,
                'event_name', OLD.event_name,
                'group_name', v_group_name,
                'deleted_by', v_user_id
            )
        );
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers with updated functions
DROP TRIGGER IF EXISTS log_form_activity_trigger ON public.forms;
CREATE TRIGGER log_form_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.forms
    FOR EACH ROW
    EXECUTE FUNCTION public.log_form_activity();

DROP TRIGGER IF EXISTS log_patient_group_activity_trigger ON public.patient_groups;
CREATE TRIGGER log_patient_group_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.patient_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.log_patient_group_activity();

DROP TRIGGER IF EXISTS log_group_event_activity_trigger ON public.group_events;
CREATE TRIGGER log_group_event_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.group_events
    FOR EACH ROW
    EXECUTE FUNCTION public.log_group_event_activity();
