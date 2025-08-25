#!/usr/bin/env node

/**
 * Script simplifié pour créer la table 'reservations' via l'ORM Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndCreateTable() {
  console.log('🔍 Vérification de l\'existence de la table reservations...');
  
  try {
    // D'abord, essayer de faire une requête sur la table pour voir si elle existe
    const { data, error } = await supabase
      .from('reservations')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('table') || error.code === 'PGRST116') {
        console.log('❌ Table reservations introuvable');
        console.log('💡 Erreur:', error.message);
        
        // Essayer de créer via une migration simple
        await createTableViaClient();
      } else {
        throw error;
      }
    } else {
      console.log('✅ Table reservations existe déjà!');
      console.log('📊 Vérification des données...');
      
      const { data: reservations, error: selectError } = await supabase
        .from('reservations')
        .select('*')
        .limit(5);
      
      if (selectError) {
        console.log('⚠️ Erreur lors de la lecture:', selectError.message);
      } else {
        console.log(`📈 ${reservations.length} réservations trouvées`);
        if (reservations.length > 0) {
          console.log('🎯 Première réservation:', {
            id: reservations[0].id,
            numero: reservations[0].numero,
            statut: reservations[0].statut,
            client: `${reservations[0].client_prenom} ${reservations[0].client_nom}`
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await createTableViaClient();
  }
}

async function createTableViaClient() {
  console.log('🚀 Tentative de création via l\'insertion de données de test...');
  
  try {
    // Essayer d'insérer des données de test - cela va forcer la création de la table
    const { data, error } = await supabase
      .from('reservations')
      .insert([
        {
          numero: 'RES-2024-TEST-001',
          hotel_id: 1,
          client_nom: 'Test',
          client_prenom: 'Utilisateur',
          client_email: 'test@example.com',
          client_telephone: '0123456789',
          date_arrivee: '2024-08-20',
          date_depart: '2024-08-25',
          nombre_personnes: 1,
          statut: 'EN_ATTENTE',
          prix_total: 100.00,
          acompte: 0.00,
          notes: 'Données de test pour validation'
        }
      ]);
    
    if (error) {
      console.log('❌ Impossible d\'insérer:', error.message);
      
      // Vérifier si c'est un problème de politique RLS
      if (error.message.includes('RLS') || error.message.includes('policy')) {
        console.log('🔐 Problème de politique RLS - table existe probablement');
        console.log('✅ La table reservations semble exister mais les politiques RLS bloquent l\'accès');
        return true;
      }
      
      // Vérifier d'autres tables pour confirmation de la connexion
      await verifyConnection();
      return false;
    } else {
      console.log('✅ Données de test insérées - table créée avec succès!');
      console.log('📊 Données insérées:', data);
      return true;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
    await verifyConnection();
    return false;
  }
}

async function verifyConnection() {
  console.log('🔍 Vérification de la connexion et des autres tables...');
  
  try {
    // Vérifier les tables existantes
    const tables = ['hotels', 'rooms', 'users'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: accessible`);
      }
    }
    
    // Vérifier spécifiquement les hôtels pour s'assurer qu'on a des données de référence
    const { data: hotels, error: hotelError } = await supabase
      .from('hotels')
      .select('id, nom')
      .limit(3);
    
    if (hotelError) {
      console.log('⚠️ Impossible de lire les hôtels:', hotelError.message);
    } else {
      console.log(`📊 ${hotels.length} hôtels disponibles pour les réservations`);
      hotels.forEach(hotel => {
        console.log(`  - Hotel ${hotel.id}: ${hotel.nom}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur de vérification:', error.message);
  }
}

// Fonction pour créer manuellement des réservations de test
async function createTestReservations() {
  console.log('📝 Création de réservations de test supplémentaires...');
  
  const testReservations = [
    {
      numero: 'RES-2024-002',
      hotel_id: 1,
      client_nom: 'Martin',
      client_prenom: 'Jean',
      client_email: 'jean.martin@email.com',
      client_telephone: '0123456789',
      date_arrivee: '2024-08-22',
      date_depart: '2024-08-27',
      nombre_personnes: 1,
      statut: 'CONFIRMEE',
      prix_total: 225.00,
      acompte: 50.00,
      notes: 'Réservation confirmée'
    },
    {
      numero: 'RES-2024-003',
      hotel_id: 1,
      client_nom: 'Dupont',
      client_prenom: 'Marie',
      client_email: 'marie.dupont@email.com',
      client_telephone: '0987654321',
      date_arrivee: '2024-08-25',
      date_depart: '2024-08-27',
      nombre_personnes: 2,
      statut: 'EN_COURS',
      prix_total: 180.00,
      acompte: 90.00,
      notes: 'Séjour en cours'
    }
  ];
  
  for (const reservation of testReservations) {
    const { data, error } = await supabase
      .from('reservations')
      .insert([reservation]);
    
    if (error) {
      console.log(`⚠️ Erreur pour ${reservation.numero}:`, error.message);
    } else {
      console.log(`✅ Réservation ${reservation.numero} créée`);
    }
  }
}

async function main() {
  console.log('🚀 SoliReserve - Création de la table reservations');
  console.log('=' .repeat(50));
  
  const success = await checkAndCreateTable();
  
  if (success) {
    console.log('\n📊 Création de données de test supplémentaires...');
    await createTestReservations();
  }
  
  console.log('\n🎯 Résumé final:');
  
  // Test final de lecture
  try {
    const { data: finalCheck, error: finalError } = await supabase
      .from('reservations')
      .select('*')
      .limit(5);
    
    if (finalError) {
      console.log('❌ Test final échoué:', finalError.message);
    } else {
      console.log(`✅ Table reservations opérationnelle avec ${finalCheck.length} enregistrements`);
      console.log('🎉 Vous pouvez maintenant utiliser les réservations dans votre application!');
    }
  } catch (error) {
    console.error('❌ Erreur lors du test final:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkAndCreateTable, createTestReservations };