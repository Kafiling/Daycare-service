-- Performance optimization indexes for forms table
-- Run this in your Supabase SQL Editor

-- Index for ORDER BY created_at DESC queries
CREATE INDEX IF NOT EXISTS idx_forms_created_at ON forms(created_at DESC);

-- Index for filtering by active status
CREATE INDEX IF NOT EXISTS idx_forms_is_active ON forms(is_active);

-- Index for filtering by priority level
CREATE INDEX IF NOT EXISTS idx_forms_priority_level ON forms(priority_level);

-- Index for filtering by category/label
CREATE INDEX IF NOT EXISTS idx_forms_label ON forms(label);

-- Composite index for common filter combinations (active status + sort)
CREATE INDEX IF NOT EXISTS idx_forms_active_created ON forms(is_active, created_at DESC);

-- Add a comment to track when these were added
COMMENT ON INDEX idx_forms_created_at IS 'Performance optimization - Added for sorting by created_at';
