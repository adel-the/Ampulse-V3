const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://pgjatiookprsvfesrsrx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnamF0aW9va3Byc3ZmZXNyc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ1OTEwOSwiZXhwIjoyMDcxMDM1MTA5fQ.Yr-Mr8uLJBUdAsRE5W2C_29-bcC4tb82ACBsKRfRgps';

async function finalVerification() {
    console.log('🔍 VÉRIFICATION FINALE - État des tables Supabase');
    console.log('='.repeat(60));
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
    });

    const tables = [
        { name: 'hotels', description: 'Établissements hôteliers' },
        { name: 'rooms', description: 'Chambres et inventaire' },
        { name: 'operateurs_sociaux', description: '🎯 OPÉRATEURS SOCIAUX (TABLE CRITIQUE)' },
        { name: 'clients', description: 'Base clients' },
        { name: 'users', description: 'Utilisateurs système' },
        { name: 'reservations', description: 'Réservations' },
        { name: 'conventions_prix', description: 'Accords de prix' }
    ];

    const results = {
        existing: [],
        missing: [],
        total: tables.length
    };

    console.log('📊 Test d\'existence des tables...\n');

    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table.name)
                .select('*')
                .limit(1);

            if (error) {
                console.log(`❌ ${table.name} - ${table.description}`);
                console.log(`   Erreur: ${error.message}\n`);
                results.missing.push(table.name);
            } else {
                console.log(`✅ ${table.name} - ${table.description}`);
                console.log(`   Status: OK (${data.length} échantillon(s) trouvé(s))\n`);
                results.existing.push(table.name);
            }
        } catch (e) {
            console.log(`💥 ${table.name} - ${table.description}`);
            console.log(`   Exception: ${e.message}\n`);
            results.missing.push(table.name);
        }
    }

    // Résumé
    console.log('='.repeat(60));
    console.log('📋 RÉSUMÉ FINAL');
    console.log('='.repeat(60));
    console.log(`✅ Tables existantes: ${results.existing.length}/${results.total}`);
    console.log(`❌ Tables manquantes: ${results.missing.length}/${results.total}`);
    
    if (results.existing.length > 0) {
        console.log(`\n🟢 Tables fonctionnelles:`);
        results.existing.forEach(table => console.log(`   • ${table}`));
    }
    
    if (results.missing.length > 0) {
        console.log(`\n🔴 Tables manquantes (CRITIQUE):`);
        results.missing.forEach(table => console.log(`   • ${table}`));
    }

    // Focus sur operateurs_sociaux
    console.log('\n' + '='.repeat(60));
    console.log('🎯 FOCUS : operateurs_sociaux');
    console.log('='.repeat(60));
    
    if (results.existing.includes('operateurs_sociaux')) {
        console.log('🎉 SUCCÈS ! La table operateurs_sociaux existe !');
        console.log('✅ Plus d\'erreur 404 pour operateurs_sociaux');
        console.log('✅ L\'application peut maintenant fonctionner');
        
        // Test approfondi de la table
        try {
            const { data, error } = await supabase
                .from('operateurs_sociaux')
                .select('nom, prenom, organisation, statut')
                .limit(5);

            if (!error && data.length > 0) {
                console.log(`\n📊 ${data.length} opérateur(s) trouvé(s):`);
                data.forEach((op, i) => {
                    console.log(`   ${i+1}. ${op.prenom} ${op.nom} - ${op.organisation} (${op.statut})`);
                });
            }
        } catch (e) {
            console.log('⚠️  Erreur lors du test approfondi:', e.message);
        }
        
    } else {
        console.log('🚨 ÉCHEC ! La table operateurs_sociaux n\'existe toujours pas !');
        console.log('❌ L\'erreur 404 persiste');
        console.log('🔧 SOLUTION : Exécuter le SQL manuellement dans Supabase');
        console.log('📋 Voir le fichier SOLUTION_OPERATEURS_SOCIAUX.md');
    }

    // Instructions finales
    console.log('\n' + '='.repeat(60));
    console.log('📝 INSTRUCTIONS FINALES');
    console.log('='.repeat(60));
    
    if (results.missing.length > 0) {
        console.log('🔧 ACTIONS REQUISES:');
        console.log('1. Aller sur https://supabase.com/dashboard/project/pgjatiookprsvfesrsrx/editor');
        console.log('2. Ouvrir SQL Editor > New query');
        console.log('3. Copier-coller le SQL depuis SOLUTION_OPERATEURS_SOCIAUX.md');
        console.log('4. Cliquer sur "Run" pour exécuter');
        console.log('5. Vérifier que "operateurs_sociaux créée avec 5 enregistrements" s\'affiche');
        console.log('6. Redémarrer l\'application Next.js');
    } else {
        console.log('🎊 PARFAIT ! Toutes les tables sont créées !');
        console.log('✅ L\'application devrait fonctionner sans erreur 404');
        console.log('🚀 Vous pouvez maintenant utiliser toutes les fonctionnalités');
    }

    return {
        success: results.missing.length === 0,
        existing: results.existing,
        missing: results.missing,
        operateursExists: results.existing.includes('operateurs_sociaux')
    };
}

// Exécution
finalVerification().then(result => {
    console.log('\n' + '='.repeat(60));
    if (result.operateursExists) {
        console.log('🎉 MISSION ACCOMPLIE ! operateurs_sociaux existe !');
        process.exit(0);
    } else {
        console.log('🚨 MISSION EN COURS - Table operateurs_sociaux manquante');
        process.exit(1);
    }
}).catch(error => {
    console.error('💥 Erreur lors de la vérification:', error);
    process.exit(1);
});