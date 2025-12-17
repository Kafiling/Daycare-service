-- Add blood pressure and heart rate fields to patient_checkins table
ALTER TABLE public.patient_checkins
ADD COLUMN systolic_bp integer NULL,
ADD COLUMN diastolic_bp integer NULL,
ADD COLUMN heart_rate integer NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.patient_checkins.systolic_bp IS 'Systolic blood pressure (mmHg)';
COMMENT ON COLUMN public.patient_checkins.diastolic_bp IS 'Diastolic blood pressure (mmHg)';
COMMENT ON COLUMN public.patient_checkins.heart_rate IS 'Heart rate (beats per minute)';
