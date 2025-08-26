-- ============================================
-- Add a test establishment for development
-- ============================================

-- Temporarily drop the foreign key constraint for testing
ALTER TABLE public.hotels 
DROP CONSTRAINT IF EXISTS hotels_user_owner_id_fkey;

-- Insert a test establishment
INSERT INTO public.hotels (
    nom,
    adresse,
    ville,
    code_postal,
    telephone,
    email,
    gestionnaire,
    statut,
    chambres_total,
    chambres_occupees,
    taux_occupation,
    siret,
    directeur,
    telephone_directeur,
    email_directeur,
    capacite,
    description,
    type_etablissement,
    user_owner_id
) VALUES (
    'Résidence de Développement',
    '123 Rue de Test',
    'Paris',
    '75001',
    '01 23 45 67 89',
    'test@hotel-test.fr',
    'Gestionnaire Test',
    'ACTIF',
    20,
    5,
    25.0,
    '12345678901234',
    'Directeur Test',
    '01 98 76 54 32',
    'directeur@hotel-test.fr',
    50,
    'Établissement de démonstration pour le développement',
    'hotel',
    '00000000-0000-0000-0000-000000000000'::UUID
) ON CONFLICT (siret) DO NOTHING;

-- Add some test rooms for this hotel
INSERT INTO public.rooms (hotel_id, numero, type, prix, statut, floor)
SELECT 
    h.id,
    'R' || generate_series,
    CASE 
        WHEN generate_series % 3 = 0 THEN 'Suite'
        WHEN generate_series % 2 = 0 THEN 'Double'
        ELSE 'Simple'
    END,
    CASE 
        WHEN generate_series % 3 = 0 THEN 150
        WHEN generate_series % 2 = 0 THEN 100
        ELSE 75
    END,
    CASE 
        WHEN generate_series <= 3 THEN 'occupee'
        WHEN generate_series <= 5 THEN 'maintenance'
        ELSE 'disponible'
    END,
    (generate_series - 1) / 5 + 1
FROM 
    public.hotels h,
    generate_series(1, 10)
WHERE 
    h.nom = 'Résidence de Développement'
    AND NOT EXISTS (
        SELECT 1 FROM public.rooms r 
        WHERE r.hotel_id = h.id 
        AND r.numero = 'R' || generate_series
    );