-- ============================================
-- SEED DATA FOR INITIAL SETUP
-- ============================================
-- This migration adds initial equipment data to the system

-- ============================================
-- 1. INSERT DEFAULT EQUIPMENT CATALOG
-- ============================================
INSERT INTO public.equipments (nom, nom_en, description, description_en, icone, categorie, ordre_affichage, est_premium) 
VALUES
    -- Connectivity Equipment
    ('WiFi gratuit', 'Free WiFi', 'Connexion Internet sans fil gratuite dans tout l''établissement', 'Free wireless internet throughout the property', 'Wifi', 'connectivity', 1, false),
    ('WiFi haut débit', 'High-speed WiFi', 'Connexion Internet très haut débit', 'High-speed internet connection', 'Wifi', 'connectivity', 2, true),
    ('Ethernet', 'Ethernet', 'Connexion Internet filaire dans la chambre', 'Wired internet connection in room', 'Wifi', 'connectivity', 3, false),
    ('Téléphone', 'Phone', 'Téléphone dans la chambre', 'In-room telephone', 'Phone', 'connectivity', 4, false),
    ('Fax', 'Fax', 'Service de fax disponible', 'Fax service available', 'Printer', 'connectivity', 5, false),

    -- Services
    ('Service en chambre', 'Room Service', 'Service de restauration en chambre 24h/24', '24-hour room service', 'Coffee', 'services', 1, false),
    ('Blanchisserie', 'Laundry', 'Service de blanchisserie et pressing', 'Laundry and dry cleaning service', 'Shirt', 'services', 2, false),
    ('Ménage quotidien', 'Daily Housekeeping', 'Service de ménage quotidien', 'Daily housekeeping service', 'Home', 'services', 3, false),
    ('Conciergerie', 'Concierge', 'Service de conciergerie', 'Concierge service', 'Users', 'services', 4, true),
    ('Navette aéroport', 'Airport Shuttle', 'Service de navette vers l''aéroport', 'Airport shuttle service', 'Car', 'services', 5, true),
    ('Location de voiture', 'Car Rental', 'Service de location de voiture', 'Car rental service', 'Car', 'services', 6, false),
    ('Bagagerie', 'Luggage Storage', 'Service de bagagerie', 'Luggage storage service', 'Package', 'services', 7, false),

    -- Wellness & Bathroom
    ('Salle de bain privée', 'Private Bathroom', 'Salle de bain privative complète', 'Complete private bathroom', 'Bath', 'wellness', 1, false),
    ('Douche', 'Shower', 'Douche dans la salle de bain', 'Shower in bathroom', 'Droplet', 'wellness', 2, false),
    ('Baignoire', 'Bathtub', 'Baignoire dans la salle de bain', 'Bathtub in bathroom', 'Bath', 'wellness', 3, false),
    ('Jacuzzi', 'Jacuzzi', 'Jacuzzi privatif', 'Private jacuzzi', 'Waves', 'wellness', 4, true),
    ('Sèche-cheveux', 'Hair Dryer', 'Sèche-cheveux dans la salle de bain', 'Hair dryer in bathroom', 'Wind', 'wellness', 5, false),
    ('Articles de toilette', 'Toiletries', 'Articles de toilette gratuits', 'Free toiletries', 'Package', 'wellness', 6, false),
    ('Peignoir', 'Bathrobe', 'Peignoir fourni', 'Bathrobe provided', 'Shirt', 'wellness', 7, false),
    ('Chaussons', 'Slippers', 'Chaussons fournis', 'Slippers provided', 'Footprints', 'wellness', 8, false),
    ('Spa', 'Spa', 'Accès au spa de l''établissement', 'Access to property spa', 'Sparkles', 'wellness', 9, true),
    ('Sauna', 'Sauna', 'Accès au sauna', 'Sauna access', 'Thermometer', 'wellness', 10, true),
    ('Piscine', 'Swimming Pool', 'Accès à la piscine', 'Swimming pool access', 'Waves', 'wellness', 11, false),
    ('Salle de fitness', 'Fitness Center', 'Accès à la salle de fitness', 'Fitness center access', 'Dumbbell', 'wellness', 12, false),

    -- Room Amenities
    ('Télévision', 'Television', 'Télévision écran plat', 'Flat-screen TV', 'Tv', 'general', 1, false),
    ('Télévision satellite', 'Satellite TV', 'Chaînes satellite internationales', 'International satellite channels', 'Tv', 'general', 2, false),
    ('Netflix', 'Netflix', 'Accès Netflix inclus', 'Netflix access included', 'Tv', 'general', 3, true),
    ('Climatisation', 'Air Conditioning', 'Climatisation réglable', 'Adjustable air conditioning', 'Wind', 'general', 4, false),
    ('Chauffage', 'Heating', 'Chauffage réglable', 'Adjustable heating', 'Thermometer', 'general', 5, false),
    ('Coffre-fort', 'Safe', 'Coffre-fort dans la chambre', 'In-room safe', 'Lock', 'security', 1, false),
    ('Minibar', 'Minibar', 'Minibar dans la chambre', 'In-room minibar', 'Wine', 'general', 6, false),
    ('Machine à café', 'Coffee Machine', 'Machine à café Nespresso', 'Nespresso coffee machine', 'Coffee', 'general', 7, false),
    ('Bouilloire', 'Kettle', 'Bouilloire électrique', 'Electric kettle', 'Coffee', 'general', 8, false),
    ('Réfrigérateur', 'Refrigerator', 'Réfrigérateur dans la chambre', 'In-room refrigerator', 'Refrigerator', 'general', 9, false),
    ('Micro-ondes', 'Microwave', 'Four micro-ondes', 'Microwave oven', 'Zap', 'general', 10, false),
    ('Kitchenette', 'Kitchenette', 'Kitchenette équipée', 'Equipped kitchenette', 'Utensils', 'general', 11, true),
    ('Bureau', 'Desk', 'Bureau de travail', 'Work desk', 'Monitor', 'general', 12, false),
    ('Fer à repasser', 'Iron', 'Fer et planche à repasser', 'Iron and ironing board', 'Shirt', 'general', 13, false),
    ('Balcon', 'Balcony', 'Balcon privatif', 'Private balcony', 'Home', 'general', 14, false),
    ('Terrasse', 'Terrace', 'Terrasse privative', 'Private terrace', 'Trees', 'general', 15, true),
    ('Vue mer', 'Sea View', 'Vue sur la mer', 'Sea view', 'Waves', 'general', 16, true),
    ('Vue jardin', 'Garden View', 'Vue sur le jardin', 'Garden view', 'Trees', 'general', 17, false),
    ('Vue ville', 'City View', 'Vue sur la ville', 'City view', 'Building', 'general', 18, false),

    -- Accessibility
    ('Accessible PMR', 'Wheelchair Accessible', 'Chambre accessible aux personnes à mobilité réduite', 'Wheelchair accessible room', 'Accessibility', 'accessibility', 1, false),
    ('Salle de bain PMR', 'Accessible Bathroom', 'Salle de bain adaptée PMR', 'Wheelchair accessible bathroom', 'Accessibility', 'accessibility', 2, false),
    ('Ascenseur', 'Elevator', 'Accès par ascenseur', 'Elevator access', 'ArrowUp', 'accessibility', 3, false),
    ('Rampe d''accès', 'Wheelchair Ramp', 'Rampe d''accès pour fauteuil roulant', 'Wheelchair access ramp', 'Accessibility', 'accessibility', 4, false),
    ('Barres d''appui', 'Grab Bars', 'Barres d''appui dans la salle de bain', 'Grab bars in bathroom', 'Grip', 'accessibility', 5, false),
    ('Sonnette d''alarme', 'Emergency Bell', 'Sonnette d''alarme dans la salle de bain', 'Emergency bell in bathroom', 'Bell', 'accessibility', 6, false),

    -- Security
    ('Détecteur de fumée', 'Smoke Detector', 'Détecteur de fumée dans la chambre', 'Smoke detector in room', 'AlertTriangle', 'security', 2, false),
    ('Extincteur', 'Fire Extinguisher', 'Extincteur à proximité', 'Fire extinguisher nearby', 'Flame', 'security', 3, false),
    ('Caméra de surveillance', 'Security Camera', 'Surveillance 24h/24', '24-hour surveillance', 'Camera', 'security', 4, false),
    ('Serrure électronique', 'Electronic Lock', 'Serrure à carte magnétique', 'Magnetic card lock', 'CreditCard', 'security', 5, false),
    ('Interphone', 'Intercom', 'Interphone dans la chambre', 'In-room intercom', 'Phone', 'security', 6, false),

    -- Recreation
    ('Jeux de société', 'Board Games', 'Jeux de société disponibles', 'Board games available', 'Gamepad2', 'recreation', 1, false),
    ('Bibliothèque', 'Library', 'Bibliothèque de livres', 'Book library', 'Book', 'recreation', 2, false),
    ('Console de jeux', 'Game Console', 'Console de jeux vidéo', 'Video game console', 'Gamepad2', 'recreation', 3, true),
    ('Table de billard', 'Pool Table', 'Table de billard', 'Pool table', 'Circle', 'recreation', 4, false),
    ('Table de ping-pong', 'Ping Pong Table', 'Table de ping-pong', 'Ping pong table', 'Circle', 'recreation', 5, false),
    ('Salle de jeux', 'Game Room', 'Salle de jeux commune', 'Common game room', 'Gamepad2', 'recreation', 6, false),

    -- Restaurant & Bar
    ('Restaurant', 'Restaurant', 'Restaurant sur place', 'On-site restaurant', 'Utensils', 'services', 8, false),
    ('Bar', 'Bar', 'Bar de l''hôtel', 'Hotel bar', 'Wine', 'services', 9, false),
    ('Petit-déjeuner inclus', 'Breakfast Included', 'Petit-déjeuner continental inclus', 'Continental breakfast included', 'Coffee', 'services', 10, false),
    ('Petit-déjeuner buffet', 'Buffet Breakfast', 'Petit-déjeuner buffet', 'Buffet breakfast', 'Utensils', 'services', 11, true),
    ('Demi-pension', 'Half Board', 'Demi-pension disponible', 'Half board available', 'Utensils', 'services', 12, true),
    ('Pension complète', 'Full Board', 'Pension complète disponible', 'Full board available', 'Utensils', 'services', 13, true),

    -- Parking & Transport
    ('Parking gratuit', 'Free Parking', 'Parking gratuit sur place', 'Free on-site parking', 'Car', 'services', 14, false),
    ('Parking payant', 'Paid Parking', 'Parking payant disponible', 'Paid parking available', 'Car', 'services', 15, false),
    ('Parking couvert', 'Covered Parking', 'Parking couvert disponible', 'Covered parking available', 'Car', 'services', 16, true),
    ('Station de recharge', 'Charging Station', 'Station de recharge pour véhicules électriques', 'Electric vehicle charging station', 'Zap', 'services', 17, true),
    ('Location de vélos', 'Bike Rental', 'Location de vélos disponible', 'Bike rental available', 'Bike', 'services', 18, false)
ON CONFLICT (nom) DO NOTHING;

-- ============================================
-- 2. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to calculate hotel occupancy rate
CREATE OR REPLACE FUNCTION calculate_hotel_occupancy(hotel_id_param INTEGER)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_rooms INTEGER;
    occupied_rooms INTEGER;
    occupancy_rate DECIMAL(5,2);
BEGIN
    -- Get total rooms (excluding maintenance)
    SELECT COUNT(*) INTO total_rooms 
    FROM public.rooms 
    WHERE hotel_id = hotel_id_param AND statut != 'maintenance';
    
    -- Get occupied rooms
    SELECT COUNT(*) INTO occupied_rooms 
    FROM public.rooms 
    WHERE hotel_id = hotel_id_param AND statut = 'occupee';
    
    -- Calculate rate
    IF total_rooms > 0 THEN
        occupancy_rate = (occupied_rooms::DECIMAL / total_rooms::DECIMAL) * 100;
    ELSE
        occupancy_rate = 0;
    END IF;
    
    -- Update hotel record
    UPDATE public.hotels 
    SET 
        chambres_total = total_rooms + (SELECT COUNT(*) FROM public.rooms WHERE hotel_id = hotel_id_param AND statut = 'maintenance'),
        chambres_occupees = occupied_rooms,
        taux_occupation = occupancy_rate
    WHERE id = hotel_id_param;
    
    RETURN occupancy_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to get all equipment for a room (including hotel equipment)
CREATE OR REPLACE FUNCTION get_room_all_equipment(room_id_param INTEGER)
RETURNS TABLE(
    equipment_id INTEGER,
    nom TEXT,
    description TEXT,
    icone TEXT,
    categorie TEXT,
    source TEXT, -- 'room' or 'hotel'
    est_disponible BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    -- Get room-specific equipment
    SELECT 
        e.id,
        e.nom,
        e.description,
        e.icone,
        e.categorie,
        'room'::TEXT as source,
        re.est_disponible
    FROM public.room_equipments re
    JOIN public.equipments e ON re.equipment_id = e.id
    WHERE re.room_id = room_id_param
    
    UNION
    
    -- Get hotel-level equipment
    SELECT 
        e.id,
        e.nom,
        e.description,
        e.icone,
        e.categorie,
        'hotel'::TEXT as source,
        he.est_disponible
    FROM public.hotel_equipments he
    JOIN public.equipments e ON he.equipment_id = e.id
    WHERE he.hotel_id = (SELECT hotel_id FROM public.rooms WHERE id = room_id_param)
    AND e.id NOT IN (SELECT equipment_id FROM public.room_equipments WHERE room_id = room_id_param)
    
    ORDER BY categorie, nom;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. CREATE VIEW FOR ROOM DETAILS
-- ============================================
CREATE OR REPLACE VIEW room_details_view AS
SELECT 
    r.*,
    h.nom as hotel_nom,
    h.adresse as hotel_adresse,
    h.ville as hotel_ville,
    rc.name as category_name,
    rc.base_price as category_base_price,
    COUNT(DISTINCT re.equipment_id) as equipment_count
FROM public.rooms r
LEFT JOIN public.hotels h ON r.hotel_id = h.id
LEFT JOIN public.room_categories rc ON r.category_id = rc.id
LEFT JOIN public.room_equipments re ON r.id = re.room_id
GROUP BY r.id, h.id, rc.id;

-- Grant permissions on the view
GRANT SELECT ON room_details_view TO authenticated;