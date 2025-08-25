-- Script pour créer la table des réservations
-- À exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    client_nom VARCHAR(255) NOT NULL,
    client_prenom VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_telephone VARCHAR(50),
    date_arrivee DATE NOT NULL,
    date_depart DATE NOT NULL,
    nombre_personnes INTEGER DEFAULT 1,
    statut VARCHAR(50) DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE')),
    prix_total DECIMAL(10,2) DEFAULT 0,
    acompte DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    operateur_social_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_reservations_hotel ON reservations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reservations_room ON reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(date_arrivee, date_depart);
CREATE INDEX IF NOT EXISTS idx_reservations_statut ON reservations(statut);

-- Politique RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on reservations" ON reservations
    FOR ALL USING (true);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_reservations_updated_at 
    BEFORE UPDATE ON reservations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insérer quelques données de test
INSERT INTO reservations (numero, hotel_id, client_nom, client_prenom, date_arrivee, date_depart, statut) VALUES
    ('RES-2024-001', 1, 'Martin', 'Jean', '2024-08-20', '2024-08-25', 'CONFIRMEE'),
    ('RES-2024-002', 2, 'Dupont', 'Marie', '2024-08-22', '2024-08-24', 'EN_COURS'),
    ('RES-2024-003', 3, 'Bernard', 'Pierre', '2024-08-25', '2024-08-30', 'EN_ATTENTE')
ON CONFLICT (numero) DO NOTHING;