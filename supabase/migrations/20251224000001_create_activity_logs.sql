-- Create activity_logs table for tracking all system activities
-- Records are automatically deleted after 90 days

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Activity information
    activity_type text NOT NULL, -- 'survey_submitted', 'patient_created', 'patient_updated', 'patient_deleted', 'survey_created', 'survey_updated', 'survey_deleted', 'group_created', 'group_updated', 'group_deleted', 'group_assigned', 'checkin', 'event_created', 'event_updated', 'event_deleted', etc.
    entity_type text NOT NULL, -- 'patient', 'survey', 'submission', 'group', 'event', 'checkin', etc.
    entity_id text NOT NULL, -- ID of the affected entity
    
    -- User who performed the action
    performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    performed_by_name text, -- Cached name for display even if user is deleted
    
    -- Description and metadata
    description text NOT NULL, -- Human-readable description of the activity
    metadata jsonb DEFAULT '{}'::jsonb, -- Additional data about the activity (old values, new values, etc.)
    
    -- IP and user agent for audit trail
    ip_address inet,
    user_agent text,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at timestamp with time zone DEFAULT timezone('utc'::text, now() + interval '90 days') NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS activity_logs_activity_type_idx ON public.activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS activity_logs_entity_type_idx ON public.activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS activity_logs_entity_id_idx ON public.activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS activity_logs_performed_by_idx ON public.activity_logs(performed_by);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_expires_at_idx ON public.activity_logs(expires_at);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS activity_logs_entity_lookup_idx ON public.activity_logs(entity_type, entity_id, created_at DESC);

-- Comment on table and columns
COMMENT ON TABLE public.activity_logs IS 'Activity log for tracking all system changes. Records are automatically deleted after 90 days.';
COMMENT ON COLUMN public.activity_logs.activity_type IS 'Type of activity performed (e.g., survey_submitted, patient_created)';
COMMENT ON COLUMN public.activity_logs.entity_type IS 'Type of entity affected (e.g., patient, survey, submission)';
COMMENT ON COLUMN public.activity_logs.entity_id IS 'ID of the affected entity';
COMMENT ON COLUMN public.activity_logs.performed_by IS 'User who performed the action';
COMMENT ON COLUMN public.activity_logs.metadata IS 'Additional data about the activity in JSON format';
COMMENT ON COLUMN public.activity_logs.expires_at IS 'Automatic deletion date (90 days from creation)';

-- Function to automatically delete expired logs
CREATE OR REPLACE FUNCTION public.delete_expired_activity_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM public.activity_logs
    WHERE expires_at < timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run daily cleanup (using pg_cron if available)
-- Note: This requires pg_cron extension which may need to be enabled manually
-- Alternatively, this can be called from a serverless function daily

-- Function to log activity (helper function for triggers and application code)
CREATE OR REPLACE FUNCTION public.log_activity(
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
        p_activity_type,
        p_entity_type,
        p_entity_id,
        p_performed_by,
        v_user_name,
        p_description,
        p_metadata
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for submission logging
CREATE OR REPLACE FUNCTION public.log_submission_activity()
RETURNS trigger AS $$
BEGIN
    -- Log survey submission
    PERFORM public.log_activity(
        'survey_submitted',
        'submission',
        NEW.id::text,
        NEW.nurse_id,
        'แบบสอบถามถูกส่งสำหรับผู้ใช้บริการ ' || NEW.patient_id,
        jsonb_build_object(
            'patient_id', NEW.patient_id,
            'survey_id', NEW.form_id,
            'total_score', NEW.total_evaluation_score,
            'evaluation_result', NEW.evaluation_result
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for patient logging
CREATE OR REPLACE FUNCTION public.log_patient_activity()
RETURNS trigger AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Log patient creation
        PERFORM public.log_activity(
            'patient_created',
            'patient',
            NEW.id,
            auth.uid(),
            'สร้างข้อมูลผู้ใช้บริการใหม่: ' || NEW.first_name || ' ' || NEW.last_name,
            jsonb_build_object(
                'patient_id', NEW.id,
                'first_name', NEW.first_name,
                'last_name', NEW.last_name
            )
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Log soft delete
        IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
            PERFORM public.log_activity(
                'patient_deleted',
                'patient',
                NEW.id,
                NEW.deleted_by,
                'ลบข้อมูลผู้ใช้บริการ: ' || NEW.first_name || ' ' || NEW.last_name,
                jsonb_build_object(
                    'patient_id', NEW.id,
                    'scheduled_deletion', NEW.scheduled_permanent_delete_at
                )
            );
        -- Log patient update (excluding automated fields)
        ELSIF (OLD.first_name != NEW.first_name OR 
               OLD.last_name != NEW.last_name OR 
               OLD.date_of_birth != NEW.date_of_birth OR
               OLD.gender != NEW.gender OR
               OLD.phone_number != NEW.phone_number OR
               OLD.address != NEW.address OR
               OLD.emergency_contact != NEW.emergency_contact OR
               OLD.emergency_phone != NEW.emergency_phone) THEN
            PERFORM public.log_activity(
                'patient_updated',
                'patient',
                NEW.id,
                auth.uid(),
                'อัปเดตข้อมูลผู้ใช้บริการ: ' || NEW.first_name || ' ' || NEW.last_name,
                jsonb_build_object(
                    'patient_id', NEW.id,
                    'changes', jsonb_build_object(
                        'old', row_to_json(OLD),
                        'new', row_to_json(NEW)
                    )
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for survey logging
CREATE OR REPLACE FUNCTION public.log_form_activity()
RETURNS trigger AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        PERFORM public.log_activity(
            'survey_created',
            'survey',
            NEW.form_id::text,
            COALESCE(NEW.created_by, auth.uid()),
            'สร้างแบบสอบถามใหม่: ' || NEW.title,
            jsonb_build_object(
                'survey_id', NEW.form_id,
                'title', NEW.title,
                'label', NEW.label
            )
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        PERFORM public.log_activity(
            'survey_updated',
            'survey',
            NEW.form_id::text,
            auth.uid(),
            'อัปเดตแบบสอบถาม: ' || NEW.title,
            jsonb_build_object(
                'survey_id', NEW.form_id,
                'title', NEW.title
            )
        );
    ELSIF (TG_OP = 'DELETE') THEN
        PERFORM public.log_activity(
            'survey_deleted',
            'survey',
            OLD.form_id::text,
            auth.uid(),
            'ลบแบบสอบถาม: ' || OLD.title,
            jsonb_build_object(
                'survey_id', OLD.form_id,
                'title', OLD.title
            )
        );
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for patient group logging
CREATE OR REPLACE FUNCTION public.log_patient_group_activity()
RETURNS trigger AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        PERFORM public.log_activity(
            'group_created',
            'patient_group',
            NEW.id::text,
            auth.uid(),
            'สร้างกลุ่มผู้ใช้บริการใหม่: ' || NEW.name,
            jsonb_build_object(
                'group_id', NEW.id,
                'name', NEW.name,
                'description', NEW.description
            )
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        PERFORM public.log_activity(
            'group_updated',
            'patient_group',
            NEW.id::text,
            auth.uid(),
            'อัปเดตกลุ่มผู้ใช้บริการ: ' || NEW.name,
            jsonb_build_object(
                'group_id', NEW.id,
                'name', NEW.name
            )
        );
    ELSIF (TG_OP = 'DELETE') THEN
        PERFORM public.log_activity(
            'group_deleted',
            'patient_group',
            OLD.id::text,
            auth.uid(),
            'ลบกลุ่มผู้ใช้บริการ: ' || OLD.name,
            jsonb_build_object(
                'group_id', OLD.id,
                'name', OLD.name
            )
        );
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for patient check-in logging
CREATE OR REPLACE FUNCTION public.log_checkin_activity()
RETURNS trigger AS $$
BEGIN
    PERFORM public.log_activity(
        'patient_checkin',
        'checkin',
        NEW.id::text,
        auth.uid(),
        'ผู้ใช้บริการเช็คอิน: ' || NEW.patient_id,
        jsonb_build_object(
            'patient_id', NEW.patient_id,
            'check_in_time', NEW.check_in_time,
            'has_vitals', (NEW.vitals IS NOT NULL)
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for group event logging
CREATE OR REPLACE FUNCTION public.log_group_event_activity()
RETURNS trigger AS $$
DECLARE
    v_group_name text;
BEGIN
    -- Get group name
    SELECT name INTO v_group_name
    FROM public.patient_groups
    WHERE id = NEW.group_id;
    
    IF (TG_OP = 'INSERT') THEN
        PERFORM public.log_activity(
            'event_created',
            'group_event',
            NEW.id::text,
            auth.uid(),
            'สร้างกิจกรรมกลุ่มใหม่: ' || NEW.event_name || ' (' || v_group_name || ')',
            jsonb_build_object(
                'event_id', NEW.id,
                'event_name', NEW.event_name,
                'group_id', NEW.group_id,
                'group_name', v_group_name,
                'event_datetime', NEW.event_datetime
            )
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        PERFORM public.log_activity(
            'event_updated',
            'group_event',
            NEW.id::text,
            auth.uid(),
            'อัปเดตกิจกรรมกลุ่ม: ' || NEW.event_name || ' (' || v_group_name || ')',
            jsonb_build_object(
                'event_id', NEW.id,
                'event_name', NEW.event_name,
                'group_name', v_group_name
            )
        );
    ELSIF (TG_OP = 'DELETE') THEN
        PERFORM public.log_activity(
            'event_deleted',
            'group_event',
            OLD.id::text,
            auth.uid(),
            'ลบกิจกรรมกลุ่ม: ' || OLD.event_name || ' (' || v_group_name || ')',
            jsonb_build_object(
                'event_id', OLD.id,
                'event_name', OLD.event_name,
                'group_name', v_group_name
            )
        );
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic activity logging

-- Submissions trigger
DROP TRIGGER IF EXISTS log_submission_activity_trigger ON public.submissions;
CREATE TRIGGER log_submission_activity_trigger
    AFTER INSERT ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.log_submission_activity();

-- Patients trigger
DROP TRIGGER IF EXISTS log_patient_activity_trigger ON public.patients;
CREATE TRIGGER log_patient_activity_trigger
    AFTER INSERT OR UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION public.log_patient_activity();

-- Surveys trigger
DROP TRIGGER IF EXISTS log_form_activity_trigger ON public.forms;
CREATE TRIGGER log_form_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.forms
    FOR EACH ROW
    EXECUTE FUNCTION public.log_form_activity();

-- Patient groups trigger
DROP TRIGGER IF EXISTS log_patient_group_activity_trigger ON public.patient_groups;
CREATE TRIGGER log_patient_group_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.patient_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.log_patient_group_activity();

-- Check-ins trigger
DROP TRIGGER IF EXISTS log_checkin_activity_trigger ON public.patient_checkins;
CREATE TRIGGER log_checkin_activity_trigger
    AFTER INSERT ON public.patient_checkins
    FOR EACH ROW
    EXECUTE FUNCTION public.log_checkin_activity();

-- Group events trigger
DROP TRIGGER IF EXISTS log_group_event_activity_trigger ON public.group_events;
CREATE TRIGGER log_group_event_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.group_events
    FOR EACH ROW
    EXECUTE FUNCTION public.log_group_event_activity();

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity_logs
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.activity_logs;
CREATE POLICY "Enable read access for authenticated users" ON public.activity_logs
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.activity_logs;
CREATE POLICY "Enable insert for authenticated users" ON public.activity_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON TABLE public.activity_logs TO authenticated;
GRANT ALL ON TABLE public.activity_logs TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.delete_expired_activity_logs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_expired_activity_logs() TO service_role;
GRANT EXECUTE ON FUNCTION public.log_activity(text, text, text, uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_activity(text, text, text, uuid, text, jsonb) TO service_role;
