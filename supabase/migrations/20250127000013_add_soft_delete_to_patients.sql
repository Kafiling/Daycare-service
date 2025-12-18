-- Add soft delete fields to patients table
ALTER TABLE public.patients
ADD COLUMN deleted_at timestamp with time zone NULL,
ADD COLUMN deleted_by uuid NULL,
ADD COLUMN scheduled_permanent_delete_at timestamp with time zone NULL;

-- Add index for soft delete queries (to efficiently filter out deleted records)
CREATE INDEX IF NOT EXISTS patients_deleted_at_idx 
ON public.patients USING btree (deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.patients.deleted_at IS 'Timestamp when the patient record was soft deleted';
COMMENT ON COLUMN public.patients.deleted_by IS 'UUID of the admin user who deleted the record';
COMMENT ON COLUMN public.patients.scheduled_permanent_delete_at IS 'Scheduled date for permanent deletion (3 months after soft delete)';

-- Create function to automatically set permanent delete date
CREATE OR REPLACE FUNCTION set_permanent_delete_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    NEW.scheduled_permanent_delete_at := NEW.deleted_at + INTERVAL '3 months';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set permanent delete date when soft deleting
CREATE TRIGGER set_patient_permanent_delete_date
BEFORE UPDATE ON public.patients
FOR EACH ROW
WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
EXECUTE FUNCTION set_permanent_delete_date();

-- Add foreign key constraint for deleted_by (optional, depends on your auth setup)
-- Uncomment if you want to enforce referential integrity
ALTER TABLE public.patients
ADD CONSTRAINT patients_deleted_by_fkey 
FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL;
