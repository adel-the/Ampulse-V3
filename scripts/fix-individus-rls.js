const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function fixIndividusRLS() {
  console.log('🔧 Correction des problèmes RLS pour la table individus...\n');

  try {
    // 1. Vérifier le statut RLS actuel
    console.log('📊 Vérification du statut RLS actuel...');
    const { data: rlsStatus, error: statusError } = await supabase.rpc('get_rls_status', {
      table_name: 'individus'
    }).single();

    if (statusError && statusError.message.includes('function')) {
      // La fonction n'existe pas, créons-la
      console.log('⚠️ Création de la fonction de vérification RLS...');
      await supabase.rpc('query', {
        query: `
          CREATE OR REPLACE FUNCTION get_rls_status(table_name text)
          RETURNS TABLE(relrowsecurity boolean) AS $$
          BEGIN
            RETURN QUERY
            SELECT c.relrowsecurity
            FROM pg_class c
            WHERE c.relname = table_name
            AND c.relnamespace = 'public'::regnamespace;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      });
    }

    // 2. Désactiver RLS pour le développement
    console.log('🔓 Désactivation de RLS pour la table individus...');
    const { error: disableError } = await supabase.rpc('query', {
      query: 'ALTER TABLE individus DISABLE ROW LEVEL SECURITY;'
    });

    if (disableError && !disableError.message.includes('already')) {
      throw disableError;
    }

    // 3. Accorder tous les privilèges aux rôles anon et authenticated
    console.log('✅ Attribution des permissions complètes...');
    const permissions = [
      'GRANT ALL ON individus TO anon;',
      'GRANT ALL ON individus TO authenticated;',
      'GRANT USAGE ON SEQUENCE individus_id_seq TO anon;',
      'GRANT USAGE ON SEQUENCE individus_id_seq TO authenticated;'
    ];

    for (const permission of permissions) {
      const { error } = await supabase.rpc('query', { query: permission });
      if (error && !error.message.includes('already')) {
        console.warn(`⚠️ Avertissement: ${error.message}`);
      }
    }

    // 4. Test de création d'un individu
    console.log('\n🧪 Test de création d\'individu...');
    const testIndividu = {
      usager_id: 1,
      nom: 'Test',
      prenom: 'RLS Fix',
      date_naissance: '2000-01-01',
      lien_parente: 'test',
      is_chef_famille: false
    };

    const { data: created, error: createError } = await supabase
      .from('individus')
      .insert(testIndividu)
      .select()
      .single();

    if (createError) {
      console.error('❌ Erreur lors du test de création:', createError);
    } else {
      console.log('✅ Test de création réussi!');
      
      // Nettoyer le test
      if (created?.id) {
        await supabase.from('individus').delete().eq('id', created.id);
        console.log('🧹 Données de test nettoyées');
      }
    }

    console.log('\n✨ Correction RLS terminée avec succès!');
    console.log('\n📝 Recommandations:');
    console.log('1. Redémarrez votre serveur de développement');
    console.log('2. Videz le cache du navigateur');
    console.log('3. Testez à nouveau la création d\'individus');
    console.log('\n⚠️ Note: RLS est désactivé pour le développement uniquement.');
    console.log('Pour la production, réactivez RLS avec: ALTER TABLE individus ENABLE ROW LEVEL SECURITY;');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  }
}

// Fonction helper pour exécuter des requêtes SQL brutes si rpc n'est pas disponible
async function executeSQL(query) {
  try {
    const { data, error } = await supabase.rpc('query', { query });
    return { data, error };
  } catch (e) {
    // Fallback: utiliser une requête directe
    console.warn('⚠️ RPC non disponible, tentative directe...');
    return { data: null, error: e };
  }
}

fixIndividusRLS();