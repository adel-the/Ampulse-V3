import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Les variables d\'environnement Supabase ne sont pas configurées');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
  console.log('🔍 Vérification de la structure de la base de données...\n');

  try {
    // Check which tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('❌ Erreur lors de la récupération des tables:', tablesError);
      return;
    }

    console.log('📋 Tables disponibles:');
    const tableNames = tables.map(t => t.table_name).sort();
    tableNames.forEach(name => console.log(`  - ${name}`));

    // Check specific table structures
    const tablesToCheck = ['hotels', 'rooms', 'room_categories', 'equipment_assignments', 'reservations', 'conventions_prix'];
    
    for (const tableName of tablesToCheck) {
      if (tableNames.includes(tableName)) {
        console.log(`\n🔍 Structure de la table "${tableName}":`);
        
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', tableName)
          .eq('table_schema', 'public')
          .order('ordinal_position');

        if (columnsError) {
          console.error(`❌ Erreur pour ${tableName}:`, columnsError);
        } else {
          columns.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(nullable)'}`);
          });
        }

        // Check foreign key constraints
        const { data: constraints, error: constraintsError } = await supabase
          .rpc('exec_sql', {
            sql: `
              SELECT 
                tc.constraint_name,
                tc.constraint_type,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                rc.delete_rule
              FROM information_schema.table_constraints AS tc
              JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
              LEFT JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
              LEFT JOIN information_schema.referential_constraints AS rc
                ON rc.constraint_name = tc.constraint_name
              WHERE tc.table_name = '${tableName}' AND tc.table_schema = 'public'
              ORDER BY tc.constraint_name;
            `
          });

        if (!constraintsError && constraints && constraints.length > 0) {
          console.log(`  Contraintes:`);
          constraints.forEach(c => {
            if (c.constraint_type === 'FOREIGN KEY') {
              console.log(`    FK: ${c.column_name} → ${c.foreign_table_name}.${c.foreign_column_name} (${c.delete_rule || 'NO ACTION'})`);
            } else {
              console.log(`    ${c.constraint_type}: ${c.column_name || 'multiple'}`);
            }
          });
        }
      } else {
        console.log(`\n⚠️  Table "${tableName}" n'existe pas`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

// Exécuter la vérification
checkDatabaseStructure().then(() => {
  console.log('\n✨ Vérification terminée');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});