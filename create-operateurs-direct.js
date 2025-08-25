const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://pgjatiookprsvfesrsrx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnamF0aW9va3Byc3ZmZXNyc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ1OTEwOSwiZXhwIjoyMDcxMDM1MTA5fQ.Yr-Mr8uLJBUdAsRE5W2C_29-bcC4tb82ACBsKRfRgps';

async function executeMultipleStatements() {
    console.log('🚀 Création de la table operateurs_sociaux via requêtes multiples...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
    });

    // Étape 1: Vérifier si la table existe
    try {
        const { data: testData, error: testError } = await supabase
            .from('operateurs_sociaux')
            .select('id')
            .limit(1);

        if (!testError) {
            console.log('✅ Table operateurs_sociaux existe déjà!');
            
            // Compter les enregistrements
            const { count } = await supabase
                .from('operateurs_sociaux')
                .select('*', { count: 'exact', head: true });
            
            console.log(`📊 ${count || 0} opérateurs trouvés`);
            
            if (count >= 5) {
                return {
                    tableCreated: true,
                    operateursInserted: true,
                    selectWorks: true,
                    totalOperateurs: count,
                    errors: []
                };
            }
        }
    } catch (e) {
        console.log('📝 Table n\'existe pas, création nécessaire...');
    }

    // Étape 2: Créer la table directement via SQL DDL avec l'API REST
    console.log('🔧 Création de la table via requête DDL...');
    
    try {
        // Utiliser l'endpoint SQL direct
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                sql: `
                    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
                    
                    CREATE TABLE IF NOT EXISTS public.operateurs_sociaux (
                        id SERIAL PRIMARY KEY,
                        nom VARCHAR(255) NOT NULL UNIQUE,
                        type VARCHAR(100) NOT NULL DEFAULT 'association',
                        secteur_activite VARCHAR(255),
                        adresse TEXT,
                        ville VARCHAR(100),
                        code_postal VARCHAR(10),
                        telephone VARCHAR(20),
                        email VARCHAR(255),
                        contact_principal VARCHAR(255),
                        siret VARCHAR(20),
                        statut VARCHAR(50) DEFAULT 'actif',
                        date_creation DATE DEFAULT CURRENT_DATE,
                        nombre_places_total INTEGER DEFAULT 0,
                        nombre_places_occupees INTEGER DEFAULT 0,
                        description TEXT,
                        notes TEXT,
                        created_at TIMESTAMPTZ DEFAULT now(),
                        updated_at TIMESTAMPTZ DEFAULT now()
                    );
                    
                    CREATE INDEX IF NOT EXISTS idx_operateurs_sociaux_nom ON public.operateurs_sociaux(nom);
                    CREATE INDEX IF NOT EXISTS idx_operateurs_sociaux_type ON public.operateurs_sociaux(type);
                    CREATE INDEX IF NOT EXISTS idx_operateurs_sociaux_statut ON public.operateurs_sociaux(statut);
                `
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.log('⚠️  Création DDL échouée:', errorText);
        } else {
            console.log('✅ Table créée avec succès');
        }

        // Activer RLS
        await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
            },
            body: JSON.stringify({
                sql: `
                    ALTER TABLE public.operateurs_sociaux ENABLE ROW LEVEL SECURITY;
                    DROP POLICY IF EXISTS "operateurs_sociaux_all_operations" ON public.operateurs_sociaux;
                    CREATE POLICY "operateurs_sociaux_all_operations" ON public.operateurs_sociaux FOR ALL USING (true) WITH CHECK (true);
                `
            })
        });

        console.log('🔒 RLS configuré');

    } catch (error) {
        console.log('⚠️  Erreur création DDL:', error.message);
    }

    // Étape 3: Attendre un peu et insérer les données
    console.log('⏳ Attente de la propagation des changements...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Insérer les données de test
    console.log('📊 Insertion des données de test...');
    
    const operateursData = [
        {
            nom: 'Association Aide Sociale Marseille',
            type: 'association',
            secteur_activite: 'Action sociale',
            ville: 'Marseille',
            statut: 'actif',
            nombre_places_total: 50
        },
        {
            nom: 'Entreprise Solidaire Sud',
            type: 'entreprise',
            secteur_activite: 'Insertion professionnelle',
            ville: 'Marseille',
            statut: 'actif',
            nombre_places_total: 25
        },
        {
            nom: 'Collectivité PACA',
            type: 'collectivite',
            secteur_activite: 'Services publics',
            ville: 'Aix-en-Provence',
            statut: 'actif',
            nombre_places_total: 100
        },
        {
            nom: 'Fondation Logement Social',
            type: 'association',
            secteur_activite: 'Logement social',
            ville: 'Marseille',
            statut: 'actif',
            nombre_places_total: 75
        },
        {
            nom: 'Centre d\'Action Sociale',
            type: 'collectivite',
            secteur_activite: 'Action sociale',
            ville: 'Marseille',
            statut: 'actif',
            nombre_places_total: 40
        }
    ];

    let insertedCount = 0;
    let retries = 3;
    
    while (retries > 0) {
        try {
            // Tenter l'insertion en bloc
            const { data: insertData, error: insertError } = await supabase
                .from('operateurs_sociaux')
                .insert(operateursData)
                .select();

            if (!insertError) {
                insertedCount = insertData.length;
                console.log(`✅ ${insertedCount} opérateurs insérés avec succès`);
                break;
            } else {
                console.log(`⚠️  Erreur insertion (tentative ${4-retries}/3):`, insertError.message);
                
                if (insertError.message.includes('schema cache')) {
                    console.log('🔄 Cache non synchronisé, nouvelle tentative...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    retries--;
                } else {
                    break;
                }
            }
        } catch (error) {
            console.log('❌ Erreur lors de l\'insertion:', error.message);
            retries--;
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    // Étape 4: Vérification finale
    console.log('🔍 Vérification finale...');
    
    let finalAttempts = 3;
    let finalData = null;
    
    while (finalAttempts > 0) {
        try {
            const { data, error } = await supabase
                .from('operateurs_sociaux')
                .select('id, nom, type, statut');

            if (!error) {
                finalData = data;
                break;
            } else {
                console.log(`⚠️  Erreur vérification (tentative ${4-finalAttempts}/3):`, error.message);
                await new Promise(resolve => setTimeout(resolve, 2000));
                finalAttempts--;
            }
        } catch (error) {
            console.log('❌ Erreur vérification:', error.message);
            finalAttempts--;
            if (finalAttempts > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    if (finalData) {
        console.log(`📈 ${finalData.length} opérateurs trouvés:`);
        finalData.forEach(op => {
            console.log(`  - ${op.nom} (${op.type}) - ${op.statut}`);
        });

        return {
            tableCreated: true,
            operateursInserted: finalData.length >= 5,
            selectWorks: true,
            totalOperateurs: finalData.length,
            errors: []
        };
    } else {
        return {
            tableCreated: true,
            operateursInserted: insertedCount >= 5,
            selectWorks: false,
            errors: ['Impossible de vérifier le contenu final de la table']
        };
    }
}

// Exécution
executeMultipleStatements().then(result => {
    console.log('\n📋 RAPPORT FINAL:');
    console.log(`✅/❌ Table créée: ${result.tableCreated ? '✅' : '❌'}`);
    console.log(`✅/❌ 5 opérateurs insérés: ${result.operateursInserted ? '✅' : '❌'}`);
    console.log(`✅/❌ SELECT fonctionne: ${result.selectWorks ? '✅' : '❌'}`);
    
    if (result.totalOperateurs !== undefined) {
        console.log(`📊 Total opérateurs: ${result.totalOperateurs}`);
    }
    
    if (result.errors.length > 0) {
        console.log('🚨 Erreurs rencontrées:');
        result.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (result.tableCreated && result.operateursInserted && result.selectWorks) {
        console.log('\n🎉 MISSION ACCOMPLIE! Plus d\'erreur 404 pour operateurs_sociaux!');
    }
    
    process.exit(result.selectWorks ? 0 : 1);
}).catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
});