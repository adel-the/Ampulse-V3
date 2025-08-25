-- Script de correction des politiques RLS pour les équipements
-- À exécuter dans Supabase SQL Editor si les tables existent déjà

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow read access to equipments" ON equipments;
DROP POLICY IF EXISTS "Allow all operations on equipments for authenticated users" ON equipments;
DROP POLICY IF EXISTS "Allow read access to hotel_equipments" ON hotel_equipments;
DROP POLICY IF EXISTS "Allow all operations on hotel_equipments for authenticated users" ON hotel_equipments;

-- Créer les nouvelles politiques plus permissives
CREATE POLICY "Allow all operations on equipments" ON equipments
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on hotel_equipments" ON hotel_equipments
    FOR ALL USING (true);