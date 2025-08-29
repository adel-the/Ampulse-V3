-- Drop v_conventions_tarifaires_detail view as it's no longer needed
-- We now use Supabase's foreign key expansion directly in queries
-- This simplifies the database structure and improves maintainability

DROP VIEW IF EXISTS v_conventions_tarifaires_detail;

-- The view functionality is replaced by using foreign key expansion in queries:
-- .from('conventions_tarifaires').select('*, clients(raison_sociale), room_categories(name, capacity), hotels(nom)')