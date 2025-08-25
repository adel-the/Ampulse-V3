-- Migration: Remove unused junction tables for equipment management
-- Date: 2025-08-25
-- Description: Drop room_equipments and hotel_equipments tables as equipment 
--              is now managed via JSONB fields in the rooms and hotels tables

-- =====================================================================
-- BACKUP NOTE: Before running this migration in production, ensure you have
-- a complete database backup. This migration will permanently delete data.
-- =====================================================================

-- Drop room_equipments table and all its dependencies
-- CASCADE will also drop any foreign key constraints, indexes, and triggers
DROP TABLE IF EXISTS room_equipments CASCADE;

-- Drop hotel_equipments table and all its dependencies  
-- CASCADE will also drop any foreign key constraints, indexes, and triggers
DROP TABLE IF EXISTS hotel_equipments CASCADE;

-- Add explanatory comments for future reference
COMMENT ON SCHEMA public IS 'Equipment management refactored to use JSONB fields. Junction tables room_equipments and hotel_equipments removed on 2025-08-25.';

-- Log the migration completion
DO $$ 
BEGIN 
    RAISE NOTICE 'Successfully removed junction tables: room_equipments, hotel_equipments';
    RAISE NOTICE 'Equipment is now managed via JSONB amenities fields in rooms and hotels tables';
    RAISE NOTICE 'Migration 007_remove_unused_junction_tables.sql completed at %', now();
END 
$$;