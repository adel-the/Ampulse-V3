/**
 * Script de vérification des données dans maintenance_tasks
 * Affiche toutes les tâches actuellement en base de données
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:15421';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Fonction pour formater la date
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('fr-FR');
}

// Fonction pour obtenir l'emoji de priorité
function getPriorityEmoji(priority) {
  switch(priority) {
    case 'urgente': return '🔴';
    case 'haute': return '🟠';
    case 'moyenne': return '🟡';
    case 'faible': return '🟢';
    default: return '⚪';
  }
}

// Fonction pour obtenir l'emoji de statut
function getStatusEmoji(status) {
  switch(status) {
    case 'terminee': return '✅';
    case 'en_cours': return '🔄';
    case 'annulee': return '❌';
    case 'en_attente': return '⏳';
    default: return '❓';
  }
}

async function verifyData() {
  console.log('\n📊 VÉRIFICATION DES DONNÉES MAINTENANCE_TASKS');
  console.log('=' .repeat(70));

  try {
    // 1. Récupérer toutes les tâches avec leurs relations
    const { data: tasks, error, count } = await supabase
      .from('maintenance_tasks')
      .select(`
        *,
        rooms (
          id,
          numero,
          statut
        ),
        hotels (
          id,
          nom
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur lors de la récupération des données:', error);
      return;
    }

    console.log(`\n✅ TOTAL DE TÂCHES EN BASE: ${count || 0}\n`);

    if (!tasks || tasks.length === 0) {
      console.log('ℹ️  Aucune tâche de maintenance trouvée dans la base de données.');
      return;
    }

    // 2. Afficher les 10 dernières tâches créées
    console.log('📋 DERNIÈRES TÂCHES CRÉÉES (max 10):');
    console.log('-' .repeat(70));

    const recentTasks = tasks.slice(0, 10);
    
    recentTasks.forEach((task, index) => {
      console.log(`\n${index + 1}. [ID: ${task.id}] ${task.titre}`);
      console.log(`   ${getPriorityEmoji(task.priorite)} Priorité: ${task.priorite} | ${getStatusEmoji(task.statut)} Statut: ${task.statut}`);
      console.log(`   📍 Chambre: ${task.rooms?.numero || 'N/A'} | 🏨 Hôtel: ${task.hotels?.nom || 'N/A'}`);
      console.log(`   👤 Responsable: ${task.responsable || 'Non assigné'}`);
      console.log(`   📅 Échéance: ${formatDate(task.date_echeance)}`);
      if (task.description) {
        console.log(`   📝 Description: ${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}`);
      }
      if (task.notes) {
        console.log(`   💭 Notes: ${task.notes.substring(0, 50)}${task.notes.length > 50 ? '...' : ''}`);
      }
      console.log(`   🕐 Créée le: ${formatDate(task.created_at)}`);
    });

    // 3. Statistiques par priorité
    console.log('\n' + '=' .repeat(70));
    console.log('\n📊 STATISTIQUES PAR PRIORITÉ:');
    console.log('-' .repeat(30));
    
    const priorityStats = {};
    tasks.forEach(task => {
      priorityStats[task.priorite] = (priorityStats[task.priorite] || 0) + 1;
    });

    Object.entries(priorityStats)
      .sort((a, b) => {
        const order = ['urgente', 'haute', 'moyenne', 'faible'];
        return order.indexOf(a[0]) - order.indexOf(b[0]);
      })
      .forEach(([priority, count]) => {
        const percentage = ((count / tasks.length) * 100).toFixed(1);
        const bar = '█'.repeat(Math.floor(percentage / 2));
        console.log(`${getPriorityEmoji(priority)} ${priority.padEnd(10)} : ${count.toString().padStart(3)} (${percentage}%) ${bar}`);
      });

    // 4. Statistiques par statut
    console.log('\n📊 STATISTIQUES PAR STATUT:');
    console.log('-' .repeat(30));
    
    const statusStats = {};
    tasks.forEach(task => {
      statusStats[task.statut] = (statusStats[task.statut] || 0) + 1;
    });

    Object.entries(statusStats).forEach(([status, count]) => {
      const percentage = ((count / tasks.length) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(percentage / 2));
      console.log(`${getStatusEmoji(status)} ${status.padEnd(10)} : ${count.toString().padStart(3)} (${percentage}%) ${bar}`);
    });

    // 5. Tâches en retard
    console.log('\n⚠️  TÂCHES EN RETARD:');
    console.log('-' .repeat(30));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdueTasks = tasks.filter(task => {
      if (!task.date_echeance || task.statut === 'terminee' || task.statut === 'annulee') {
        return false;
      }
      const dueDate = new Date(task.date_echeance);
      return dueDate < today;
    });

    if (overdueTasks.length > 0) {
      overdueTasks.forEach(task => {
        const daysOverdue = Math.floor((today - new Date(task.date_echeance)) / (1000 * 60 * 60 * 24));
        console.log(`🚨 "${task.titre}" - Retard de ${daysOverdue} jour(s)`);
        console.log(`   Chambre ${task.rooms?.numero} | Responsable: ${task.responsable || 'Non assigné'}`);
      });
    } else {
      console.log('✅ Aucune tâche en retard');
    }

    // 6. Tâches à venir (7 prochains jours)
    console.log('\n📅 TÂCHES À VENIR (7 prochains jours):');
    console.log('-' .repeat(30));
    
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const upcomingTasks = tasks.filter(task => {
      if (!task.date_echeance || task.statut === 'terminee' || task.statut === 'annulee') {
        return false;
      }
      const dueDate = new Date(task.date_echeance);
      return dueDate >= today && dueDate <= sevenDaysFromNow;
    }).sort((a, b) => new Date(a.date_echeance) - new Date(b.date_echeance));

    if (upcomingTasks.length > 0) {
      upcomingTasks.forEach(task => {
        console.log(`📌 ${formatDate(task.date_echeance)} - "${task.titre}"`);
        console.log(`   ${getPriorityEmoji(task.priorite)} Priorité: ${task.priorite} | Chambre: ${task.rooms?.numero}`);
      });
    } else {
      console.log('ℹ️  Aucune tâche prévue dans les 7 prochains jours');
    }

    // 7. Résumé final
    console.log('\n' + '=' .repeat(70));
    console.log('\n✅ VÉRIFICATION TERMINÉE');
    console.log('\n📊 RÉSUMÉ:');
    console.log(`   • Total de tâches: ${tasks.length}`);
    console.log(`   • Tâches en attente: ${statusStats['en_attente'] || 0}`);
    console.log(`   • Tâches en cours: ${statusStats['en_cours'] || 0}`);
    console.log(`   • Tâches terminées: ${statusStats['terminee'] || 0}`);
    console.log(`   • Tâches en retard: ${overdueTasks.length}`);
    console.log(`   • Tâches urgentes: ${priorityStats['urgente'] || 0}`);
    
    console.log('\n💡 Les données sont correctement stockées dans maintenance_tasks');
    console.log('   et accessibles via l\'application sur http://localhost:3011/maintenance');

  } catch (error) {
    console.error('\n❌ Erreur lors de la vérification:', error);
  }
}

// Lancer la vérification
verifyData();