const { createClient } = require('@supabase/supabase-js');

// Configuration for local Supabase
const supabaseUrl = 'http://127.0.0.1:15421';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Create admin client (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupClientTypes() {
  console.log('🔧 Setting up client types for development...');
  
  try {
    // Check if client types exist
    const { data: existingTypes } = await supabase
      .from('client_types')
      .select('*')
      .order('ordre');

    if (existingTypes && existingTypes.length >= 3) {
      console.log('✅ Client types already exist:');
      existingTypes.forEach(type => {
        console.log(`   - ${type.nom} (ID: ${type.id})`);
      });
      return;
    }

    console.log('📝 Creating basic client types...');

    const basicTypes = [
      { 
        nom: 'Particulier', 
        description: 'Client individuel', 
        icone: 'user',
        couleur: '#3B82F6',
        ordre: 1 
      },
      { 
        nom: 'Entreprise', 
        description: 'Société commerciale', 
        icone: 'building',
        couleur: '#10B981',
        ordre: 2 
      },
      { 
        nom: 'Association', 
        description: 'Organisation à but non lucratif', 
        icone: 'users',
        couleur: '#F59E0B',
        ordre: 3 
      }
    ];

    for (const type of basicTypes) {
      const { data, error } = await supabase
        .from('client_types')
        .insert(type)
        .select();
      
      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          console.log(`⚠️  Type ${type.nom} already exists`);
        } else {
          console.log(`❌ Failed to create ${type.nom}:`, error.message);
        }
      } else {
        console.log(`✅ Created client type: ${type.nom}`);
      }
    }

    // Verify final state
    const { data: finalTypes } = await supabase
      .from('client_types')
      .select('*')
      .order('ordre');

    console.log(`\n🎉 Setup complete! ${finalTypes?.length || 0} client types available:`);
    finalTypes?.forEach(type => {
      console.log(`   - ${type.nom} (ID: ${type.id})`);
    });

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
if (require.main === module) {
  setupClientTypes().then(() => {
    console.log('\n✨ Client types setup completed successfully!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Setup error:', error);
    process.exit(1);
  });
}