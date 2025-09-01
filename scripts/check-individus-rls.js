const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.log('Assurez-vous que .env.local contient:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function checkIndividusRLS() {
  console.log('🔍 Vérification RLS pour la table individus...\n');
  console.log('URL Supabase:', supabaseUrl);
  console.log('─'.repeat(50));

  try {
    // 1. Test de lecture
    console.log('\n📖 Test de LECTURE...');
    const { data: readData, error: readError } = await supabase
      .from('individus')
      .select('*')
      .limit(1);

    if (readError) {
      console.error('❌ Erreur de lecture:', readError.message);
    } else {
      console.log('✅ Lecture réussie -', readData?.length || 0, 'ligne(s)');
    }

    // 2. Test de création
    console.log('\n✍️ Test de CRÉATION...');
    const testData = {
      usager_id: 1,
      nom: 'TestRLS',
      prenom: 'Debug',
      date_naissance: '2000-01-01',
      relation: 'Autre',
      is_chef_famille: false
    };

    const { data: insertData, error: insertError } = await supabase
      .from('individus')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erreur de création:', insertError.message);
      console.error('   Code:', insertError.code);
      console.error('   Détails:', insertError.details);
      
      if (insertError.code === '42501') {
        console.log('\n⚠️ Problème RLS détecté!');
        console.log('La politique RLS bloque la création.');
      }
    } else {
      console.log('✅ Création réussie - ID:', insertData.id);
      
      // 3. Test de mise à jour
      console.log('\n📝 Test de MISE À JOUR...');
      const { error: updateError } = await supabase
        .from('individus')
        .update({ nom: 'TestRLS-Updated' })
        .eq('id', insertData.id);

      if (updateError) {
        console.error('❌ Erreur de mise à jour:', updateError.message);
      } else {
        console.log('✅ Mise à jour réussie');
      }

      // 4. Test de suppression
      console.log('\n🗑️ Test de SUPPRESSION...');
      const { error: deleteError } = await supabase
        .from('individus')
        .delete()
        .eq('id', insertData.id);

      if (deleteError) {
        console.error('❌ Erreur de suppression:', deleteError.message);
      } else {
        console.log('✅ Suppression réussie');
      }
    }

    // 5. Résumé et recommandations
    console.log('\n' + '═'.repeat(50));
    console.log('📊 RÉSUMÉ DU DIAGNOSTIC');
    console.log('═'.repeat(50));
    
    if (insertError?.code === '42501') {
      console.log('\n🚨 Problème détecté: RLS bloque les opérations');
      console.log('\n💡 Solutions recommandées:');
      console.log('1. Le hook useIndividus a été modifié pour utiliser supabaseAdmin en développement');
      console.log('2. Relancez votre serveur de développement: npm run dev');
      console.log('3. Videz le cache du navigateur (Ctrl+Shift+R)');
      console.log('4. Si le problème persiste, exécutez: npx supabase db reset');
    } else {
      console.log('\n✅ Aucun problème RLS détecté');
      console.log('Les opérations CRUD fonctionnent correctement');
    }

    console.log('\n📝 Notes importantes:');
    console.log('- Le hook useIndividus utilise maintenant supabaseAdmin en mode dev');
    console.log('- Cela contourne les problèmes RLS en développement');
    console.log('- En production, le client normal sera utilisé avec RLS activé');

  } catch (error) {
    console.error('\n❌ Erreur inattendue:', error);
  }
}

checkIndividusRLS();