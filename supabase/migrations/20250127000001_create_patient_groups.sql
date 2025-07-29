- Create patient_groups table for organizing patients into groups
CREATE TABLE IF NOT EXISTS public.patient_groups (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    color text DEFAULT '#3B82F6',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on patient_groups
DROP TRIGGER IF EXISTS patient_groups_updated_at ON public.patient_groups;
CREATE TRIGGER patient_groups_updated_at
    BEFORE UPDATE ON public.patient_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add group_id column to patients table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'group_id'
    ) THEN
        ALTER TABLE public.patients 
        ADD COLUMN group_id uuid REFERENCES public.patient_groups(id) ON DELETE SET NULL;
        
        -- Create index for better performance
        CREATE INDEX patients_group_id_idx ON public.patients(group_id);
    END IF;
END $$;

-- Insert default patient groups
INSERT INTO public.patient_groups (name, description, color) VALUES
    ('ทั่วไป', 'กลุ่มผู้ป่วยทั่วไป', '#6B7280'),
    ('ฉุกเฉิน', 'กลุ่มผู้ป่วยฉุกเฉิน ต้องให้ความสำคัญเป็นพิเศษ', '#EF4444'),
    ('ติดตามพิเศษ', 'กลุ่มผู้ป่วยที่ต้องติดตามอาการเป็นพิเศษ', '#F59E0B'),
    ('ผู้สูงอายุ', 'กลุ่มผู้ป่วยสูงอายุที่ต้องการการดูแลเป็นพิเศษ', '#8B5CF6'),
    ('เด็กและเยาวชน', 'กลุ่มผู้ป่วยเด็กและเยาวชน', '#10B981'),
    ('ฟื้นฟู', 'กลุ่มผู้ป่วยที่อยู่ในระยะฟื้นฟูสภาพ', '#06B6D4'),
    ('เตรียมจำหน่าย', 'กลุ่มผู้ป่วยที่เตรียมจำหน่ายออกจากสถานพยาบาล', '#84CC16')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS patient_groups_name_idx ON public.patient_groups(name);
CREATE INDEX IF NOT EXISTS patient_groups_created_at_idx ON public.patient_groups(created_at DESC);

-- Add check constraints
DO $$
BEGIN
    -- Add name constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'patient_groups_name_not_empty' 
        AND table_name = 'patient_groups'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.patient_groups 
        ADD CONSTRAINT patient_groups_name_not_empty 
        CHECK (length(trim(name)) > 0);
    END IF;

    -- Add color constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'patient_groups_color_format' 
        AND table_name = 'patient_groups'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.patient_groups 
        ADD CONSTRAINT patient_groups_color_format 
        CHECK (color ~ '^#[0-9A-Fa-f]{6}$');
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE public.patient_groups IS 'Patient groups for organizing and categorizing patients based on care needs';
COMMENT ON COLUMN public.patient_groups.id IS 'Unique identifier for the patient group';
COMMENT ON COLUMN public.patient_groups.name IS 'Unique name of the patient group';
COMMENT ON COLUMN public.patient_groups.description IS 'Detailed description of the group and its purpose';
COMMENT ON COLUMN public.patient_groups.color IS 'Color code for UI display in hex format (e.g., #3B82F6)';
COMMENT ON COLUMN public.patient_groups.created_at IS 'Timestamp when the group was created';
COMMENT ON COLUMN public.patient_groups.updated_at IS 'Timestamp when the group was last updated';

-- Grant appropriate permissions
-- Authenticated users can read patient groups
GRANT SELECT ON public.patient_groups TO authenticated;

-- Service role has full access for system operations
GRANT ALL ON public.patient_groups TO service_role;

-- Staff/nurses can read patient groups (adjust based on your RLS policies)
-- You may want to add more specific permissions based on your user roles

