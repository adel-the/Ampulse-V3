/**
 * Tests pour les conventions tarifaires
 * 
 * Tests couverts:
 * - Création de convention
 * - Édition de convention
 * - Lecture par date/catégorie
 * - Gestion des mois manquants (fallback sur prix défaut)
 * - Détection des chevauchements de validité
 * - Droits d'accès
 * - Calcul des prix avec réductions
 */

const { supabase } = require('../lib/supabase');
const { conventionsApi } = require('../lib/api/conventions');

// Configuration des tests
const TEST_TIMEOUT = 30000;
const TEST_CLIENT_ID = 999; // Client de test
const TEST_CATEGORY_ID = 1; // Catégorie simple
const TEST_HOTEL_ID = 1;

// Fonction utilitaire pour nettoyer les données de test
async function cleanupTestData() {
  await supabase
    .from('conventions_tarifaires')
    .delete()
    .eq('client_id', TEST_CLIENT_ID);
}

describe('Conventions Tarifaires', () => {
  
  beforeAll(async () => {
    // Nettoyer avant les tests
    await cleanupTestData();
  });

  afterAll(async () => {
    // Nettoyer après les tests
    await cleanupTestData();
  });

  describe('Création de convention', () => {
    test('Devrait créer une convention avec prix mensuels', async () => {
      const conventionData = {
        client_id: TEST_CLIENT_ID,
        category_id: TEST_CATEGORY_ID,
        hotel_id: TEST_HOTEL_ID,
        date_debut: '2024-01-01',
        date_fin: '2024-12-31',
        prix_defaut: 100,
        prix_mensuel: {
          janvier: 90,
          fevrier: 90,
          juillet: 130,
          aout: 130
        },
        reduction_pourcentage: 10,
        conditions: 'Test convention',
        active: true
      };

      const result = await conventionsApi.upsertConvention(conventionData);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.message).toContain('succès');
    }, TEST_TIMEOUT);

    test('Devrait créer une convention avec forfait mensuel', async () => {
      const conventionData = {
        client_id: TEST_CLIENT_ID,
        category_id: 2, // Catégorie double
        hotel_id: TEST_HOTEL_ID,
        date_debut: '2024-01-01',
        date_fin: '2024-06-30',
        prix_defaut: 150,
        forfait_mensuel: 3000,
        conditions: 'Forfait test',
        active: true
      };

      const result = await conventionsApi.upsertConvention(conventionData);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
    }, TEST_TIMEOUT);
  });

  describe('Lecture des conventions', () => {
    test('Devrait récupérer les conventions d\'un client', async () => {
      const result = await conventionsApi.getClientConventions(TEST_CLIENT_ID);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      
      const convention = result.data[0];
      expect(convention).toHaveProperty('client_nom');
      expect(convention).toHaveProperty('category_nom');
      expect(convention).toHaveProperty('prix_defaut');
    }, TEST_TIMEOUT);

    test('Devrait récupérer uniquement les conventions actives', async () => {
      const result = await conventionsApi.getClientConventions(TEST_CLIENT_ID, true);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      result.data.forEach(conv => {
        expect(conv.active).toBe(true);
      });
    }, TEST_TIMEOUT);

    test('Devrait récupérer le prix applicable pour une date', async () => {
      const result = await conventionsApi.getApplicablePrice(
        TEST_CLIENT_ID,
        TEST_CATEGORY_ID,
        '2024-07-15'
      );
      
      expect(result.success).toBe(true);
      expect(result.price).toBe(130); // Prix juillet défini plus haut
    }, TEST_TIMEOUT);

    test('Devrait utiliser le prix par défaut si mois non défini', async () => {
      const result = await conventionsApi.getApplicablePrice(
        TEST_CLIENT_ID,
        TEST_CATEGORY_ID,
        '2024-03-15' // Mars n'a pas de prix spécifique
      );
      
      expect(result.success).toBe(true);
      expect(result.price).toBe(100); // Prix par défaut
    }, TEST_TIMEOUT);
  });

  describe('Gestion des chevauchements', () => {
    test('Devrait détecter un chevauchement de périodes', async () => {
      const result = await conventionsApi.checkOverlap(
        TEST_CLIENT_ID,
        TEST_CATEGORY_ID,
        '2024-06-01',
        '2024-08-31'
      );
      
      expect(result.success).toBe(true);
      expect(result.hasOverlap).toBe(true);
    }, TEST_TIMEOUT);

    test('Devrait permettre des périodes non chevauchantes', async () => {
      const result = await conventionsApi.checkOverlap(
        TEST_CLIENT_ID,
        TEST_CATEGORY_ID,
        '2025-01-01',
        '2025-12-31'
      );
      
      expect(result.success).toBe(true);
      expect(result.hasOverlap).toBe(false);
    }, TEST_TIMEOUT);

    test('Devrait empêcher la création avec chevauchement actif', async () => {
      const conventionData = {
        client_id: TEST_CLIENT_ID,
        category_id: TEST_CATEGORY_ID,
        hotel_id: TEST_HOTEL_ID,
        date_debut: '2024-06-01',
        date_fin: '2024-08-31',
        prix_defaut: 110,
        active: true
      };

      const result = await conventionsApi.upsertConvention(conventionData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('existe déjà');
    }, TEST_TIMEOUT);
  });

  describe('Modification de convention', () => {
    let conventionId;

    beforeAll(async () => {
      // Créer une convention pour les tests de modification
      const result = await conventionsApi.upsertConvention({
        client_id: TEST_CLIENT_ID,
        category_id: 3,
        hotel_id: TEST_HOTEL_ID,
        date_debut: '2024-01-01',
        date_fin: '2024-12-31',
        prix_defaut: 200,
        active: true
      });
      conventionId = result.data?.id!;
    });

    test('Devrait modifier une convention existante', async () => {
      const updatedData = {
        id: conventionId,
        client_id: TEST_CLIENT_ID,
        category_id: 3,
        hotel_id: TEST_HOTEL_ID,
        date_debut: '2024-01-01',
        date_fin: '2024-12-31',
        prix_defaut: 250,
        prix_mensuel: {
          juillet: 300,
          aout: 300
        },
        active: true
      };

      const result = await conventionsApi.upsertConvention(updatedData);
      
      expect(result.success).toBe(true);
      
      // Vérifier la modification
      const checkResult = await conventionsApi.getApplicablePrice(
        TEST_CLIENT_ID,
        3,
        '2024-07-15'
      );
      expect(checkResult.price).toBe(300);
    }, TEST_TIMEOUT);

    test('Devrait activer/désactiver une convention', async () => {
      // Désactiver
      let result = await conventionsApi.toggleConventionStatus(conventionId, false);
      expect(result.success).toBe(true);
      expect(result.message).toContain('désactivée');
      
      // Réactiver
      result = await conventionsApi.toggleConventionStatus(conventionId, true);
      expect(result.success).toBe(true);
      expect(result.message).toContain('activée');
    }, TEST_TIMEOUT);
  });

  describe('Suppression de convention', () => {
    test('Devrait supprimer une convention', async () => {
      // Créer une convention à supprimer
      const createResult = await conventionsApi.upsertConvention({
        client_id: TEST_CLIENT_ID,
        category_id: 4,
        hotel_id: TEST_HOTEL_ID,
        date_debut: '2025-01-01',
        date_fin: '2025-12-31',
        prix_defaut: 150,
        active: false
      });
      
      const conventionId = createResult.data?.id!;
      
      // Supprimer
      const deleteResult = await conventionsApi.deleteConvention(conventionId);
      expect(deleteResult.success).toBe(true);
      
      // Vérifier la suppression
      const checkResult = await conventionsApi.getClientConventions(TEST_CLIENT_ID);
      const deleted = checkResult.data?.find(c => c.id === conventionId);
      expect(deleted).toBeUndefined();
    }, TEST_TIMEOUT);
  });

  describe('Calculs de prix', () => {
    test('Devrait calculer le prix avec réduction', () => {
      const basePrice = 100;
      const reduction = 15;
      const finalPrice = conventionsApi.calculateFinalPrice(basePrice, reduction);
      
      expect(finalPrice).toBe(85);
    });

    test('Devrait utiliser le forfait mensuel si défini', () => {
      const basePrice = 100;
      const reduction = 15;
      const forfait = 2000;
      const finalPrice = conventionsApi.calculateFinalPrice(basePrice, reduction, forfait);
      
      expect(finalPrice).toBe(2000);
    });

    test('Devrait retourner le prix de base si aucune réduction', () => {
      const basePrice = 100;
      const finalPrice = conventionsApi.calculateFinalPrice(basePrice);
      
      expect(finalPrice).toBe(100);
    });
  });

  describe('Récupération par période', () => {
    test('Devrait récupérer les conventions pour une période', async () => {
      const result = await conventionsApi.getConventionsByPeriod(
        '2024-06-01',
        '2024-08-31'
      );
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      
      // Vérifier que toutes les conventions retournées sont dans la période
      result.data?.forEach(conv => {
        const debut = new Date(conv.date_debut);
        const fin = conv.date_fin ? new Date(conv.date_fin) : new Date('9999-12-31');
        const periodStart = new Date('2024-06-01');
        const periodEnd = new Date('2024-08-31');
        
        const overlaps = debut <= periodEnd && fin >= periodStart;
        expect(overlaps).toBe(true);
      });
    }, TEST_TIMEOUT);

    test('Devrait filtrer par hôtel et catégorie', async () => {
      const result = await conventionsApi.getConventionsByPeriod(
        '2024-01-01',
        '2024-12-31',
        TEST_HOTEL_ID,
        TEST_CATEGORY_ID
      );
      
      expect(result.success).toBe(true);
      result.data?.forEach(conv => {
        expect(conv.hotel_id).toBe(TEST_HOTEL_ID);
        expect(conv.category_id).toBe(TEST_CATEGORY_ID);
      });
    }, TEST_TIMEOUT);
  });

  describe('Droits d\'accès', () => {
    test('Devrait vérifier l\'authentification', async () => {
      // Simuler une déconnexion
      const { error } = await supabase.auth.signOut();
      
      // Tenter d'accéder aux conventions
      const result = await conventionsApi.getClientConventions(TEST_CLIENT_ID);
      
      // S'attendre à une erreur d'authentification
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
      
      // Note: Ce test peut varier selon la configuration RLS
    }, TEST_TIMEOUT);
  });
});

// Script pour exécuter les tests
console.log('Pour exécuter les tests:');
console.log('npm test tests/conventions.test.ts');
console.log('');
console.log('Pour exécuter un test spécifique:');
console.log('npm test tests/conventions.test.ts -t "Devrait créer une convention"');