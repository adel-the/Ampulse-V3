-- ============================================================================
-- Migration: Création de la table clients
-- Date: 2025-08-25
-- Description: 
--   Crée la table clients pour gérer les informations des clients
--   avec leurs coordonnées, type et statut
-- ============================================================================

-- Création de la table clients
CREATE TABLE IF NOT EXISTS public.clients (
  id SERIAL PRIMARY KEY,
  numero_client VARCHAR(50) UNIQUE,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  telephone VARCHAR(20),
  adresse TEXT,
  ville VARCHAR(100),
  code_postal VARCHAR(10),
  type_client VARCHAR(50) DEFAULT 'Particulier' CHECK (type_client IN ('Particulier', 'Entreprise', 'Association')),
  statut VARCHAR(50) DEFAULT 'Actif' CHECK (statut IN ('Actif', 'Inactif', 'Prospect')),
  date_naissance DATE,
  nationalite VARCHAR(100),
  piece_identite_type VARCHAR(50),
  piece_identite_numero VARCHAR(100),
  date_inscription DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_clients_nom_prenom ON public.clients(nom, prenom);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_numero_client ON public.clients(numero_client);
CREATE INDEX idx_clients_type ON public.clients(type_client);
CREATE INDEX idx_clients_statut ON public.clients(statut);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at 
  BEFORE UPDATE ON public.clients 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Fonction pour générer automatiquement le numéro client
CREATE OR REPLACE FUNCTION generate_client_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INT;
BEGIN
  IF NEW.numero_client IS NULL THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_client FROM 4) AS INT)), 0) + 1
    INTO next_number
    FROM clients
    WHERE numero_client LIKE 'CLI%';
    
    NEW.numero_client := 'CLI' || LPAD(next_number::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_client_number_trigger
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE PROCEDURE generate_client_number();

-- Politiques RLS (Row Level Security)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous les utilisateurs authentifiés
CREATE POLICY "Enable read access for all authenticated users" ON public.clients
  FOR SELECT USING (true);

-- Politique pour permettre l'insertion à tous les utilisateurs authentifiés
CREATE POLICY "Enable insert for authenticated users" ON public.clients
  FOR INSERT WITH CHECK (true);

-- Politique pour permettre la modification à tous les utilisateurs authentifiés
CREATE POLICY "Enable update for authenticated users" ON public.clients
  FOR UPDATE USING (true);

-- Politique pour permettre la suppression (avec restrictions futures possibles)
CREATE POLICY "Enable delete for authenticated users" ON public.clients
  FOR DELETE USING (true);

-- Insertion de données de test
INSERT INTO public.clients (nom, prenom, email, telephone, adresse, ville, code_postal, type_client, statut, date_naissance, nationalite)
VALUES
  ('Dubois', 'Jean', 'jean.dubois@email.com', '01 23 45 67 89', '123 Rue de la Paix', 'Paris', '75001', 'Particulier', 'Actif', '1985-03-15', 'Française'),
  ('Martin', 'Marie', 'marie.martin@email.com', '06 12 34 56 78', '456 Avenue des Fleurs', 'Lyon', '69001', 'Particulier', 'Actif', '1990-07-22', 'Française'),
  ('SARL Exemple', 'Contact', 'contact@exemple.fr', '04 78 90 12 34', '789 Boulevard des Entreprises', 'Marseille', '13001', 'Entreprise', 'Actif', NULL, NULL),
  ('Association Solidaire', 'Responsable', 'contact@asso-solidaire.org', '09 87 65 43 21', '321 Rue de la Solidarité', 'Toulouse', '31000', 'Association', 'Actif', NULL, NULL),
  ('Dupont', 'Pierre', 'pierre.dupont@email.com', '07 89 01 23 45', '654 Allée des Chênes', 'Bordeaux', '33000', 'Particulier', 'Inactif', '1975-11-30', 'Française'),
  ('Leroy', 'Sophie', 'sophie.leroy@email.com', '06 45 67 89 01', '987 Rue du Commerce', 'Nantes', '44000', 'Particulier', 'Prospect', '1988-05-18', 'Française'),
  ('Entreprise Tech', 'Directeur', 'direction@tech-company.fr', '02 40 12 34 56', '111 Zone Industrielle', 'Rennes', '35000', 'Entreprise', 'Actif', NULL, NULL),
  ('Moreau', 'Lucie', 'lucie.moreau@email.com', '06 78 90 12 34', '222 Impasse des Lilas', 'Nice', '06000', 'Particulier', 'Actif', '1992-09-10', 'Française'),
  ('Association Culturelle', 'Président', 'culture@asso.fr', '05 56 78 90 12', '333 Place de la Culture', 'Strasbourg', '67000', 'Association', 'Prospect', NULL, NULL),
  ('Bernard', 'Antoine', 'antoine.bernard@email.com', '07 23 45 67 89', '444 Chemin des Vignes', 'Montpellier', '34000', 'Particulier', 'Actif', '1983-12-25', 'Française');

-- Commentaires pour documentation
COMMENT ON TABLE public.clients IS 'Table principale pour stocker les informations des clients';
COMMENT ON COLUMN public.clients.numero_client IS 'Numéro unique auto-généré (format: CLI00001)';
COMMENT ON COLUMN public.clients.type_client IS 'Type de client: Particulier, Entreprise ou Association';
COMMENT ON COLUMN public.clients.statut IS 'Statut du client: Actif, Inactif ou Prospect';

-- Notification de fin
DO $$
BEGIN
  RAISE NOTICE 'Successfully created clients table with % test records', 10;
  RAISE NOTICE 'Migration 009_create_clients_table.sql completed at %', NOW();
END $$;