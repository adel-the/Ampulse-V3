// Script pour monitorer les événements real-time de Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function monitorMaintenanceTasks() {
  console.log('🔍 Monitoring des tâches de maintenance en temps réel');
  console.log('=====================================\n');
  console.log('📡 En attente d\'événements...\n');

  // Récupérer le premier hôtel pour le monitoring
  const { data: hotels } = await supabase
    .from('hotels')
    .select('id, nom')
    .limit(1);

  const hotelId = hotels?.[0]?.id;
  
  if (hotelId) {
    console.log(`🏨 Monitoring de l'hôtel: ${hotels[0].nom} (ID: ${hotelId})\n`);
  }

  // S'abonner aux changements
  const channel = supabase
    .channel(`monitor-maintenance-${hotelId || 'all'}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'maintenance_tasks',
        filter: hotelId ? `hotel_id=eq.${hotelId}` : undefined
      },
      (payload) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`\n[${timestamp}] 📨 Événement reçu: ${payload.eventType}`);
        
        switch (payload.eventType) {
          case 'INSERT':
            console.log('➕ Nouvelle tâche créée:');
            console.log(`   ID: ${payload.new.id}`);
            console.log(`   Titre: ${payload.new.titre}`);
            console.log(`   Statut: ${payload.new.statut}`);
            console.log(`   Priorité: ${payload.new.priorite}`);
            break;
            
          case 'UPDATE':
            console.log('✏️ Tâche modifiée:');
            console.log(`   ID: ${payload.new.id}`);
            console.log(`   Titre: ${payload.new.titre}`);
            console.log(`   Ancien statut: ${payload.old?.statut || 'N/A'}`);
            console.log(`   Nouveau statut: ${payload.new.statut}`);
            break;
            
          case 'DELETE':
            console.log('🗑️ Tâche supprimée:');
            console.log(`   ID: ${payload.old.id}`);
            console.log(`   Titre: ${payload.old.titre}`);
            break;
            
          default:
            console.log('❓ Type d\'événement inconnu:', payload.eventType);
        }
        
        console.log('---');
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Abonnement réussi aux événements real-time\n');
        console.log('💡 Créez, modifiez ou supprimez des tâches dans l\'interface pour voir les événements');
        console.log('   Ou utilisez le script test-maintenance-realtime.js dans un autre terminal\n');
        console.log('Appuyez sur Ctrl+C pour arrêter le monitoring\n');
      } else {
        console.log(`📊 Statut de l'abonnement: ${status}`);
      }
    });

  // Garder le script en cours d'exécution
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Arrêt du monitoring...');
    supabase.removeChannel(channel);
    process.exit(0);
  });
}

// Lancer le monitoring
monitorMaintenanceTasks();