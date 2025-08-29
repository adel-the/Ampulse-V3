const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function debugClientUpdate() {
  console.log('🔍 Débogage de la mise à jour du client ID 30\n');
  
  // 1. Vérifier si le client existe
  console.log('1. Vérification de l\'existence du client ID 30...');
  const { data: client, error: fetchError } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('id', 30)
    .single();
  
  if (fetchError) {
    console.error('❌ Erreur lors de la récupération du client:', fetchError);
    
    // Si le client n'existe pas, créer un client de test
    if (fetchError.code === 'PGRST116') {
      console.log('\n📝 Le client ID 30 n\'existe pas. Création d\'un client de test...');
      
      const { data: newClient, error: createError } = await supabaseAdmin
        .from('clients')
        .insert({
          client_type: 'Entreprise',
          nom: 'Test Client 30',
          email: 'test30@example.com',
          statut: 'actif'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Impossible de créer le client de test:', createError);
        return;
      }
      
      console.log('✅ Client de test créé avec ID:', newClient.id);
      console.log('Utilisez cet ID pour tester la mise à jour');
      return;
    }
    return;
  }
  
  console.log('✅ Client trouvé:', {
    id: client.id,
    nom: client.nom,
    client_type: client.client_type,
    statut: client.statut
  });
  
  // 2. Tester une mise à jour simple
  console.log('\n2. Test de mise à jour simple...');
  const updateData = {
    nom: 'Client 30 - Mis à jour',
    updated_at: new Date().toISOString()
  };
  
  console.log('Données à envoyer:', updateData);
  
  const { data: updatedClient, error: updateError } = await supabaseAdmin
    .from('clients')
    .update(updateData)
    .eq('id', 30)
    .select()
    .single();
  
  if (updateError) {
    console.error('❌ Erreur lors de la mise à jour:', updateError);
    console.error('Code d\'erreur:', updateError.code);
    console.error('Message:', updateError.message);
    console.error('Détails:', updateError.details);
    console.error('Hint:', updateError.hint);
    
    // Vérifier les permissions RLS
    console.log('\n3. Vérification des permissions RLS...');
    const { data: policies, error: policyError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'clients');
    
    if (policies && policies.length > 0) {
      console.log('⚠️ Politiques RLS actives sur la table clients:', policies.length);
      console.log('Les politiques RLS pourraient bloquer la mise à jour');
    }
    
    return;
  }
  
  console.log('✅ Mise à jour réussie!');
  console.log('Client mis à jour:', {
    id: updatedClient.id,
    nom: updatedClient.nom,
    updated_at: updatedClient.updated_at
  });
  
  // 3. Tester une mise à jour plus complexe
  console.log('\n4. Test de mise à jour complexe...');
  const complexUpdateData = {
    nom: 'Client 30 - Test Complet',
    email: 'updated30@example.com',
    telephone: '0123456789',
    ville: 'Paris',
    code_postal: '75001',
    statut: 'actif',
    updated_at: new Date().toISOString()
  };
  
  const { data: complexUpdate, error: complexError } = await supabaseAdmin
    .from('clients')
    .update(complexUpdateData)
    .eq('id', 30)
    .select()
    .single();
  
  if (complexError) {
    console.error('❌ Erreur lors de la mise à jour complexe:', complexError);
  } else {
    console.log('✅ Mise à jour complexe réussie!');
  }
  
  // 4. Vérifier la structure de la table
  console.log('\n5. Vérification de la structure de la table clients...');
  const { data: columns, error: columnsError } = await supabaseAdmin.rpc('get_table_columns', {
    table_name: 'clients'
  }).catch(() => ({ data: null, error: 'RPC non disponible' }));
  
  if (columnsError) {
    console.log('⚠️ Impossible de récupérer la structure de la table via RPC');
    
    // Essayer une requête simple pour voir les colonnes
    const { data: sample } = await supabaseAdmin
      .from('clients')
      .select('*')
      .limit(1);
    
    if (sample && sample.length > 0) {
      console.log('Colonnes disponibles:', Object.keys(sample[0]));
    }
  } else if (columns) {
    console.log('Structure de la table:', columns);
  }
  
  console.log('\n=== RÉSUMÉ ===');
  console.log('Si la mise à jour échoue avec une erreur 400, vérifiez:');
  console.log('1. Que les données envoyées correspondent au schéma de la table');
  console.log('2. Que les valeurs enum (client_type, statut) sont valides');
  console.log('3. Que les politiques RLS ne bloquent pas l\'opération');
  console.log('4. Que le service role key est correctement configuré');
}

debugClientUpdate().catch(console.error);