-- Change total_evaluation_score from integer to numeric to support decimal values
-- Migration: 20250815000001_change_score_to_numeric.sql

-- First check if the column exists and is of type integer
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'submissions' 
        AND column_name = 'total_evaluation_score'
        AND data_type = 'integer'
    ) THEN
        -- Drop the trigger that depends on the column first
        DROP TRIGGER IF EXISTS submissions_group_assignment ON public.submissions;
        
        -- Alter the column type from integer to numeric
        ALTER TABLE public.submissions 
        ALTER COLUMN total_evaluation_score TYPE numeric(10,2) USING total_evaluation_score::numeric(10,2);
        
        -- Update the default value
        ALTER TABLE public.submissions 
        ALTER COLUMN total_evaluation_score SET DEFAULT 0.00;
        
        -- Recreate the trigger
        CREATE TRIGGER submissions_group_assignment
        AFTER INSERT OR UPDATE OF total_evaluation_score ON public.submissions
        FOR EACH ROW
        EXECUTE FUNCTION trigger_group_assignment();
        
        RAISE NOTICE 'Column total_evaluation_score type changed from integer to numeric(10,2) and trigger recreated';
    ELSE
        RAISE NOTICE 'Column total_evaluation_score is either not of type integer or does not exist';
    END IF;
END $$;

-- Update comment on the column
COMMENT ON COLUMN public.submissions.total_evaluation_score IS 'Total score for the form submission, supports decimal values (e.g., 1.5)';
