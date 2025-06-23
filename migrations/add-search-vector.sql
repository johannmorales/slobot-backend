-- Migration: Add search vector column to slot table
-- Run this script manually in your PostgreSQL database

-- Add the search_vector column
ALTER TABLE slot ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Note: The GIN index will be created automatically by TypeORM's @Index decorator
-- when synchronize is enabled, or you can run the following manually if needed:
-- CREATE INDEX IF NOT EXISTS idx_slot_search_vector ON slot USING gin(search_vector);

-- Update existing records to populate search_vector
UPDATE slot 
SET search_vector = to_tsvector('english', name)
WHERE search_vector IS NULL OR search_vector = '';

-- Create a trigger function to automatically update search_vector when name changes
CREATE OR REPLACE FUNCTION update_slot_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', NEW.name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search_vector
DROP TRIGGER IF EXISTS trigger_update_slot_search_vector ON slot;
CREATE TRIGGER trigger_update_slot_search_vector
    BEFORE INSERT OR UPDATE ON slot
    FOR EACH ROW
    EXECUTE FUNCTION update_slot_search_vector(); 