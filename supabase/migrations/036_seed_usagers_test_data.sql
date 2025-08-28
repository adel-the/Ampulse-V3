-- Seed test data for usagers (beneficiaries)
-- This migration adds synthetic test data for development and testing purposes

-- First, ensure we have some prescripteurs (clients) to link to
-- Get IDs of existing clients or create test ones
DO $$
DECLARE
  entreprise_id INTEGER;
  association_id INTEGER;
  particulier_id INTEGER;
BEGIN
  -- Get or create a test entreprise
  SELECT id INTO entreprise_id FROM clients 
  WHERE client_type = 'Entreprise' 
  LIMIT 1;
  
  IF entreprise_id IS NULL THEN
    INSERT INTO clients (
      nom, raison_sociale, client_type, statut, numero_client,
      adresse, ville, code_postal, telephone, email,
      siret
    ) VALUES (
      'TECH SOLUTIONS', 'Tech Solutions SAS', 'Entreprise', 'actif', 'CLT-2024-E001',
      '123 Avenue de l''Innovation', 'Paris', '75008', '01 23 45 67 89', 'contact@techsolutions.fr',
      '12345678901234'
    ) RETURNING id INTO entreprise_id;
  END IF;

  -- Get or create a test association
  SELECT id INTO association_id FROM clients 
  WHERE client_type = 'Association' 
  LIMIT 1;
  
  IF association_id IS NULL THEN
    INSERT INTO clients (
      nom, raison_sociale, client_type, statut, numero_client,
      adresse, ville, code_postal, telephone, email
    ) VALUES (
      'SOLIDARITE PLUS', 'Association Solidarité Plus', 'Association', 'actif', 'CLT-2024-A001',
      '45 Rue de la Fraternité', 'Lyon', '69003', '04 78 12 34 56', 'contact@solidariteplus.org'
    ) RETURNING id INTO association_id;
  END IF;

  -- Get or create a test particulier prescripteur
  SELECT id INTO particulier_id FROM clients 
  WHERE client_type = 'Particulier' 
  LIMIT 1;
  
  IF particulier_id IS NULL THEN
    INSERT INTO clients (
      nom, prenom, client_type, statut, numero_client,
      adresse, ville, code_postal, telephone, email
    ) VALUES (
      'MARTIN', 'Sophie', 'Particulier', 'actif', 'CLT-2024-P001',
      '78 Boulevard Victor Hugo', 'Marseille', '13001', '06 12 34 56 78', 'sophie.martin@email.fr'
    ) RETURNING id INTO particulier_id;
  END IF;

  -- Now insert test usagers linked to these prescripteurs

  -- Usagers for the entreprise
  INSERT INTO usagers (
    numero_usager, prescripteur_id, nom, prenom, date_naissance, lieu_naissance, nationalite,
    adresse, ville, code_postal, telephone, email,
    numero_secu, caf_number,
    situation_familiale, nombre_enfants, revenus, type_revenus, prestations,
    autonomie_level, observations, statut
  ) VALUES
  (
    'USG-20240101-0001', entreprise_id, 'DUPONT', 'Jean', '1985-03-15', 'Paris', 'Française',
    '12 Rue de la République', 'Paris', '75011', '06 11 22 33 44', 'jean.dupont@email.fr',
    '1850375001234', 'CAF75123456',
    'Célibataire', 0, 800.00, 'RSA', ARRAY['RSA', 'APL'],
    'Autonome', 'Personne autonome, recherche d''emploi active', 'actif'
  ),
  (
    'USG-20240101-0002', entreprise_id, 'BERNARD', 'Marie', '1990-07-22', 'Lyon', 'Française',
    '34 Avenue des Fleurs', 'Lyon', '69007', '06 22 33 44 55', 'marie.bernard@email.fr',
    '2900769001234', 'CAF69234567',
    'Divorcé(e)', 2, 1200.00, 'Salaire', ARRAY['Allocation familiale', 'APL'],
    'Autonome', 'Mère de famille, emploi à temps partiel', 'actif'
  ),
  (
    'USG-20240101-0003', entreprise_id, 'PETIT', 'Pierre', '1978-11-08', 'Marseille', 'Française',
    '56 Boulevard du Port', 'Marseille', '13002', '06 33 44 55 66', 'pierre.petit@email.fr',
    '1781113001234', 'CAF13345678',
    'Marié(e)', 3, 950.00, 'AAH', ARRAY['AAH', 'APL', 'Allocation familiale'],
    'Semi-autonome', 'Mobilité réduite, besoin d''accompagnement ponctuel', 'actif'
  );

  -- Usagers for the association
  INSERT INTO usagers (
    numero_usager, prescripteur_id, nom, prenom, date_naissance, lieu_naissance, nationalite,
    adresse, ville, code_postal, telephone, email,
    numero_secu, caf_number,
    situation_familiale, nombre_enfants, revenus, type_revenus, prestations,
    autonomie_level, observations, statut
  ) VALUES
  (
    'USG-20240102-0001', association_id, 'MOREAU', 'Sylvie', '1965-04-28', 'Toulouse', 'Française',
    '23 Rue Saint-Michel', 'Toulouse', '31000', '06 44 55 66 77', 'sylvie.moreau@email.fr',
    '2650431001234', 'CAF31456789',
    'Veuf/Veuve', 1, 750.00, 'ASS', ARRAY['ASS', 'APL'],
    'Autonome', 'Veuve récente, en recherche d''emploi', 'actif'
  ),
  (
    'USG-20240102-0002', association_id, 'GARCIA', 'Antonio', '1972-09-14', 'Barcelone', 'Espagnole',
    '67 Avenue de l''Europe', 'Nice', '06000', '06 55 66 77 88', 'antonio.garcia@email.fr',
    '1720906001234', 'CAF06567890',
    'Union libre', 2, 1100.00, 'Salaire', ARRAY['Prime d''activité', 'Allocation familiale'],
    'Autonome', 'Travailleur saisonnier', 'actif'
  ),
  (
    'USG-20240102-0003', association_id, 'LEROY', 'Michel', '1958-12-03', 'Lille', 'Française',
    '89 Rue de la Paix', 'Lille', '59000', '06 66 77 88 99', 'michel.leroy@email.fr',
    '1581259001234', 'CAF59678901',
    'Célibataire', 0, 900.00, 'Retraite', ARRAY['APL'],
    'Non-autonome', 'Problèmes de santé importants, nécessite un suivi quotidien', 'actif'
  );

  -- Usagers for the particulier prescripteur
  INSERT INTO usagers (
    numero_usager, prescripteur_id, nom, prenom, date_naissance, lieu_naissance, nationalite,
    adresse, ville, code_postal, telephone, email,
    numero_secu, caf_number,
    situation_familiale, nombre_enfants, revenus, type_revenus, prestations,
    autonomie_level, observations, statut
  ) VALUES
  (
    'USG-20240103-0001', particulier_id, 'THOMAS', 'Lucie', '1995-06-10', 'Bordeaux', 'Française',
    '45 Quai de la Garonne', 'Bordeaux', '33000', '06 77 88 99 00', 'lucie.thomas@email.fr',
    '2950633001234', 'CAF33789012',
    'Célibataire', 0, 850.00, 'RSA', ARRAY['RSA', 'APL'],
    'Autonome', 'Jeune en insertion professionnelle', 'actif'
  ),
  (
    'USG-20240103-0002', particulier_id, 'ROBERT', 'François', '1982-02-25', 'Nantes', 'Française',
    '12 Place du Commerce', 'Nantes', '44000', '06 88 99 00 11', 'francois.robert@email.fr',
    '1820244001234', 'CAF44890123',
    'Pacsé(e)', 1, 1050.00, 'Salaire', ARRAY['Prime d''activité', 'APL'],
    'Semi-autonome', 'Troubles psychologiques légers, suivi médical régulier', 'actif'
  ),
  (
    'USG-20240103-0003', particulier_id, 'RICHARD', 'Emma', '1988-08-18', 'Strasbourg', 'Française',
    '78 Rue de la Cathédrale', 'Strasbourg', '67000', '06 99 00 11 22', 'emma.richard@email.fr',
    '2880867001234', 'CAF67901234',
    'Divorcé(e)', 3, 1300.00, 'Pension alimentaire', ARRAY['Allocation familiale', 'APL'],
    'Autonome', 'Famille monoparentale, situation stable', 'actif'
  );

  -- Add some inactive and archived usagers for testing filters
  INSERT INTO usagers (
    numero_usager, prescripteur_id, nom, prenom, date_naissance, lieu_naissance, nationalite,
    adresse, ville, code_postal, telephone, email,
    numero_secu, caf_number,
    situation_familiale, nombre_enfants, revenus, type_revenus, prestations,
    autonomie_level, observations, statut
  ) VALUES
  (
    'USG-20240104-0001', entreprise_id, 'DURAND', 'Paul', '1970-05-05', 'Rennes', 'Française',
    '90 Rue de Bretagne', 'Rennes', '35000', '06 10 11 12 13', 'paul.durand@email.fr',
    '1700535001234', 'CAF35012345',
    'Marié(e)', 2, 1500.00, 'Salaire', ARRAY['Allocation familiale'],
    'Autonome', 'A trouvé un logement permanent', 'inactif'
  ),
  (
    'USG-20240104-0002', association_id, 'LEFEBVRE', 'Anne', '1975-10-20', 'Rouen', 'Française',
    '23 Rue Jeanne d''Arc', 'Rouen', '76000', '06 14 15 16 17', 'anne.lefebvre@email.fr',
    '2751076001234', 'CAF76123456',
    'Célibataire', 0, 0.00, '', NULL,
    'Semi-autonome', 'Dossier archivé - Déménagement hors région', 'archive'
  ),
  (
    'USG-20240104-0003', particulier_id, 'MERCIER', 'Claude', '1962-01-30', 'Dijon', 'Française',
    '56 Rue de la Liberté', 'Dijon', '21000', '06 18 19 20 21', 'claude.mercier@email.fr',
    '1620121001234', 'CAF21234567',
    'Veuf/Veuve', 0, 980.00, 'Retraite', ARRAY['APL'],
    'Non-autonome', 'En attente de placement en EHPAD', 'inactif'
  );

  -- Add some additional test data with various characteristics
  INSERT INTO usagers (
    numero_usager, prescripteur_id, nom, prenom, date_naissance, lieu_naissance, nationalite,
    adresse, ville, code_postal, telephone, email,
    numero_secu, caf_number,
    situation_familiale, nombre_enfants, revenus, type_revenus, prestations,
    autonomie_level, observations, statut
  ) VALUES
  (
    'USG-20240105-0001', entreprise_id, 'BLANC', 'Isabelle', '1993-03-12', 'Grenoble', 'Française',
    '34 Rue des Alpes', 'Grenoble', '38000', '06 22 23 24 25', 'isabelle.blanc@email.fr',
    '2930338001234', 'CAF38345678',
    'Union libre', 1, 950.00, 'RSA', ARRAY['RSA', 'APL', 'Allocation familiale'],
    'Autonome', 'Jeune mère, en formation professionnelle', 'actif'
  ),
  (
    'USG-20240105-0002', association_id, 'GUERIN', 'Jacques', '1968-07-07', 'Tours', 'Française',
    '78 Rue de la Loire', 'Tours', '37000', '06 26 27 28 29', 'jacques.guerin@email.fr',
    '1680737001234', 'CAF37456789',
    'Divorcé(e)', 0, 820.00, 'AAH', ARRAY['AAH', 'APL'],
    'Semi-autonome', 'Handicap moteur partiel', 'actif'
  ),
  (
    'USG-20240105-0003', particulier_id, 'FAURE', 'Nathalie', '1980-11-15', 'Montpellier', 'Française',
    '12 Place de la Comédie', 'Montpellier', '34000', '06 30 31 32 33', 'nathalie.faure@email.fr',
    '2801134001234', 'CAF34567890',
    'Marié(e)', 4, 1400.00, 'Salaire', ARRAY['Allocation familiale', 'APL', 'Prime d''activité'],
    'Autonome', 'Famille nombreuse, situation professionnelle précaire', 'actif'
  );

  RAISE NOTICE '✅ Successfully created % test usagers', 15;
  RAISE NOTICE '   - % active usagers', 12;
  RAISE NOTICE '   - % inactive usagers', 2;
  RAISE NOTICE '   - % archived usagers', 1;
  RAISE NOTICE '   - Linked to % prescripteurs', 3;
  
END $$;

-- Create a view to easily see usager distribution
CREATE OR REPLACE VIEW usager_test_summary AS
SELECT 
  'Total Usagers' as metric,
  COUNT(*) as count
FROM usagers
UNION ALL
SELECT 
  'By Status - ' || statut as metric,
  COUNT(*) as count
FROM usagers
GROUP BY statut
UNION ALL
SELECT 
  'By Autonomy - ' || autonomie_level as metric,
  COUNT(*) as count
FROM usagers
GROUP BY autonomie_level
UNION ALL
SELECT 
  'By Prescripteur Type - ' || c.client_type as metric,
  COUNT(*) as count
FROM usagers u
JOIN clients c ON u.prescripteur_id = c.id
GROUP BY c.client_type
ORDER BY metric;

-- Add comment for documentation
COMMENT ON TABLE usagers IS 'Test data added by migration 036_seed_usagers_test_data.sql for development and testing purposes';

-- Display summary
DO $$
DECLARE
  summary_row RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  USAGERS TEST DATA SUMMARY';
  RAISE NOTICE '========================================';
  
  FOR summary_row IN SELECT * FROM usager_test_summary LOOP
    RAISE NOTICE '  % : %', RPAD(summary_row.metric, 30), summary_row.count;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Test data successfully loaded!';
  RAISE NOTICE '   You can now test the CRUD operations';
  RAISE NOTICE '   in the Clients > Usagers interface';
  RAISE NOTICE '';
END $$;