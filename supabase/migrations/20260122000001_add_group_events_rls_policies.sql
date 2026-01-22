-- Add RLS policies for group_events table
-- This fixes the issue where users cannot update group events

-- Enable RLS if not already enabled
ALTER TABLE public.group_events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view all group events
CREATE POLICY "Authenticated users can view group events"
ON public.group_events
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to create group events
CREATE POLICY "Authenticated users can create group events"
ON public.group_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to update group events
CREATE POLICY "Authenticated users can update group events"
ON public.group_events
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to delete group events
CREATE POLICY "Authenticated users can delete group events"
ON public.group_events
FOR DELETE
TO authenticated
USING (true);

-- Note: These are permissive policies. In production, you may want to restrict based on:
-- 1. User roles (admin only)
-- 2. Group membership (only if user is in the group)
-- 3. Custom permissions table
-- 
-- Example for admin-only policy:
-- USING (
--   EXISTS (
--     SELECT 1 FROM auth.users
--     WHERE auth.users.id = auth.uid()
--     AND auth.users.raw_user_meta_data->>'role' = 'admin'
--   )
-- )
