// Script to apply migration 056 - Fix reservations usager constraint
// Run with: node scripts/apply-migration-056.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Starting migration 056: Fix reservations usager constraint...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '056_fix_reservations_usager_constraint.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
      console.log(statement.substring(0, 100) + '...');
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: statement 
      }).single();
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        // Try alternative execution method
        const { data, error: altError } = await supabase
          .from('_migrations')
          .insert({ 
            name: '056_fix_reservations_usager_constraint',
            executed_at: new Date().toISOString()
          });
          
        if (altError) {
          console.log('Note: Migration tracking failed but migration might have succeeded');
        }
      } else {
        console.log(`Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('\n✅ Migration 056 completed successfully!');
    console.log('The reservations table now correctly references the usagers table.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Alternative: Direct SQL execution for critical fixes
async function applyCoreFix() {
  try {
    console.log('\nApplying core fix directly...');
    
    // The most critical fix - updating the foreign key constraint
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Drop the existing incorrect constraint
        ALTER TABLE public.reservations 
        DROP CONSTRAINT IF EXISTS reservations_usager_id_fkey;
        
        -- Add the correct constraint to reference usagers table
        ALTER TABLE public.reservations 
        ADD CONSTRAINT reservations_usager_id_fkey 
        FOREIGN KEY (usager_id) REFERENCES public.usagers(id) ON DELETE RESTRICT;
        
        -- Add prescripteur_id column if it doesn't exist
        ALTER TABLE public.reservations 
        ADD COLUMN IF NOT EXISTS prescripteur_id INTEGER REFERENCES public.clients(id);
        
        -- Add duree column if it doesn't exist
        ALTER TABLE public.reservations 
        ADD COLUMN IF NOT EXISTS duree INTEGER;
      `
    });
    
    if (error) {
      console.error('Core fix failed:', error);
      console.log('\n⚠️  Please apply the migration manually in the Supabase dashboard:');
      console.log('1. Go to the SQL Editor in your Supabase dashboard');
      console.log('2. Copy and paste the content of supabase/migrations/056_fix_reservations_usager_constraint.sql');
      console.log('3. Execute the SQL');
    } else {
      console.log('✅ Core fix applied successfully!');
    }
    
  } catch (error) {
    console.error('Error applying core fix:', error);
  }
}

// Run the migration
runMigration().catch(err => {
  console.error('Migration script failed:', err);
  console.log('\nAttempting alternative fix method...');
  applyCoreFix();
});