const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  console.log('🔧 Application de la migration pour supprimer view_type et is_smoking...\n');
  
  // Configuration pour Supabase local
  const client = new Client({
    host: 'localhost',
    port: 15432, // Port PostgreSQL de Supabase local
    database: 'postgres',
    user: 'postgres',
    password: 'postgres' // Mot de passe par défaut pour Supabase local
  });

  try {
    console.log('🔌 Connexion à PostgreSQL local...');
    await client.connect();
    console.log('✅ Connecté!');

    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '047_remove_room_view_and_smoking_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Exécution de la migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration appliquée avec succès!');
    
    // Vérifier que les colonnes ont été supprimées
    console.log('\n🔍 Vérification des colonnes...');
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rooms' 
      AND column_name IN ('view_type', 'is_smoking')
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('✅ Les colonnes view_type et is_smoking ont été supprimées avec succès!');
    } else {
      console.log('⚠️ Colonnes encore présentes:', checkResult.rows.map(r => r.column_name).join(', '));
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Connexion fermée');
  }
}

applyMigration().catch(console.error);