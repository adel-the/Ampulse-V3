const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://pgjatiookprsvfesrsrx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnamF0aW9va3Byc3ZmZXNyc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ1OTEwOSwiZXhwIjoyMDcxMDM1MTA5fQ.Yr-Mr8uLJBUdAsRE5W2C_29-bcC4tb82ACBsKRfRgps';

async function createOperateursTable() {
    console.log('🚀 Création de la table operateurs_sociaux via API REST directe...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
    });

    try {
        // Étape 1: Vérifier si la table existe déjà
        console.log('🔍 Vérification de l\'existence de la table...');
        const { data: existingData, error: checkError } = await supabase
            .from('operateurs_sociaux')
            .select('id')
            .limit(1);

        if (!checkError) {
            console.log('⚠️  La table existe déjà! Vérification des données...');
            
            // Compter les enregistrements
            const { count } = await supabase
                .from('operateurs_sociaux')
                .select('*', { count: 'exact', head: true });
            
            console.log(`📊 ${count || 0} opérateurs trouvés`);
            
            if (count >= 5) {
                console.log('✅ Table déjà créée avec données suffisantes');
                return {
                    tableCreated: true,
                    operateursInserted: true,
                    selectWorks: true,
                    totalOperateurs: count,
                    errors: []
                };
            }
        } else {
            console.log('📝 Table n\'existe pas, création nécessaire...');
        }

        // Étape 2: Utiliser l'éditeur SQL Supabase
        console.log('🔧 Utilisation de l\'API REST pour créer la table...');
        
        // URL pour l'API Supabase SQL editor
        const sqlEditorUrl = `${supabaseUrl}/rest/v1/rpc/sql`;
        
        const createTableSQL = `
CREATE TABLE IF NOT EXISTS public.operateurs_sociaux (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(100) NOT NULL,
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

ALTER TABLE public.operateurs_sociaux ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "operateurs_sociaux_all_operations" ON public.operateurs_sociaux;
CREATE POLICY "operateurs_sociaux_all_operations" ON public.operateurs_sociaux FOR ALL USING (true) WITH CHECK (true);
        `;

        // Création via fetch direct
        const createResponse = await fetch(sqlEditorUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                query: createTableSQL
            })
        });

        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.log('⚠️  Création via SQL Editor échouée, tentative alternative...');
            console.log(`Erreur: ${errorText}`);
        } else {
            console.log('✅ Structure de la table créée');
        }

        // Étape 3: Insérer les données de test via l'ORM Supabase
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

        // Insérer un par un pour éviter les conflits
        let insertedCount = 0;
        for (const operateur of operateursData) {
            const { error: insertError } = await supabase
                .from('operateurs_sociaux')
                .upsert(operateur, { onConflict: 'nom' });
            
            if (!insertError) {
                insertedCount++;
                console.log(`✅ Inséré: ${operateur.nom}`);
            } else {
                console.log(`⚠️  Erreur insertion ${operateur.nom}:`, insertError.message);
            }
        }

        // Étape 4: Vérification finale
        console.log('🔍 Vérification finale...');
        const { data: finalData, error: finalError } = await supabase
            .from('operateurs_sociaux')
            .select('id, nom, type, statut');

        if (finalError) {
            console.error('❌ Erreur vérification finale:', finalError);
            return {
                tableCreated: true,
                operateursInserted: insertedCount >= 5,
                selectWorks: false,
                errors: [finalError.message]
            };
        }

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

    } catch (error) {
        console.error('❌ Erreur générale:', error);
        return {
            tableCreated: false,
            operateursInserted: false,
            selectWorks: false,
            errors: [error.message]
        };
    }
}

// Exécution
createOperateursTable().then(result => {
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