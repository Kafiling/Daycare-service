-- Add temperature, weight, and height fields to patient_checkins table
ALTER TABLE public.patient_checkins
ADD COLUMN IF NOT EXISTS temperature NUMERIC(4, 1),
ADD COLUMN IF NOT EXISTS weight NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS height NUMERIC(5, 2);

-- Add comments to explain the new columns
COMMENT ON COLUMN public.patient_checkins.temperature IS 'Body temperature in Celsius';
COMMENT ON COLUMN public.patient_checkins.weight IS 'Weight in kilograms';
COMMENT ON COLUMN public.patient_checkins.height IS 'Height in centimeters';
