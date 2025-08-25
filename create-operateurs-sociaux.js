const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://pgjatiookprsvfesrsrx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnamF0aW9va3Byc3ZmZXNyc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ1OTEwOSwiZXhwIjoyMDcxMDM1MTA5fQ.Yr-Mr8uLJBUdAsRE5W2C_29-bcC4tb82ACBsKRfRgps';

async function createOperateursSociauxTable() {
    console.log('🚀 Création de la table operateurs_sociaux...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
    });

    const sql = `
-- Créer la table operateurs_sociaux
CREATE TABLE IF NOT EXISTS public.operateurs_sociaux (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'association', 'entreprise', 'collectivite', 'autre'
    secteur_activite VARCHAR(255),
    adresse TEXT,
    ville VARCHAR(100),
    code_postal VARCHAR(10),
    telephone VARCHAR(20),
    email VARCHAR(255),
    contact_principal VARCHAR(255),
    siret VARCHAR(20),
    statut VARCHAR(50) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'suspendu')),
    date_creation DATE DEFAULT CURRENT_DATE,
    nombre_places_total INTEGER DEFAULT 0,
    nombre_places_occupees INTEGER DEFAULT 0,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_operateurs_sociaux_nom ON public.operateurs_sociaux(nom);
CREATE INDEX IF NOT EXISTS idx_operateurs_sociaux_type ON public.operateurs_sociaux(type);
CREATE INDEX IF NOT EXISTS idx_operateurs_sociaux_statut ON public.operateurs_sociaux(statut);

-- RLS permissif
ALTER TABLE public.operateurs_sociaux ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operateurs_sociaux_all_operations" ON public.operateurs_sociaux FOR ALL USING (true) WITH CHECK (true);

-- Données de test
INSERT INTO public.operateurs_sociaux (nom, type, secteur_activite, ville, statut, nombre_places_total) VALUES
('Association Aide Sociale Marseille', 'association', 'Action sociale', 'Marseille', 'actif', 50),
('Entreprise Solidaire Sud', 'entreprise', 'Insertion professionnelle', 'Marseille', 'actif', 25),
('Collectivité PACA', 'collectivite', 'Services publics', 'Aix-en-Provence', 'actif', 100),
('Fondation Logement Social', 'association', 'Logement social', 'Marseille', 'actif', 75),
('Centre d\\'Action Sociale', 'collectivite', 'Action sociale', 'Marseille', 'actif', 40)
ON CONFLICT (nom) DO NOTHING;
    `;

    try {
        // Étape 1: Créer la table et insérer les données
        console.log('📝 Exécution du SQL...');
        const { error: sqlError } = await supabase.rpc('exec', { sql });
        
        if (sqlError) {
            console.log('⚠️  Erreur RPC, tentative avec SQL direct...');
            
            // Alternative: Utiliser l'API REST directement
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'apikey': supabaseServiceKey
                },
                body: JSON.stringify({ query: sql })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erreur SQL:', errorText);
                throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
            }
        }

        console.log('✅ Table créée avec succès');

        // Étape 2: Vérifier le nombre d'opérateurs
        console.log('📊 Vérification des données...');
        const { data: countData, error: countError } = await supabase
            .from('operateurs_sociaux')
            .select('id', { count: 'exact', head: true });

        if (countError) {
            console.error('❌ Erreur lors du comptage:', countError);
            return {
                tableCreated: true,
                operateursInserted: false,
                selectWorks: false,
                errors: [countError.message]
            };
        }

        const totalOperateurs = countData?.length || 0;
        console.log(`📈 Nombre d'opérateurs: ${totalOperateurs}`);

        // Étape 3: Test SELECT simple
        console.log('🔍 Test SELECT...');
        const { data: selectData, error: selectError } = await supabase
            .from('operateurs_sociaux')
            .select('id, nom, type, statut')
            .limit(5);

        if (selectError) {
            console.error('❌ Erreur SELECT:', selectError);
            return {
                tableCreated: true,
                operateursInserted: totalOperateurs >= 5,
                selectWorks: false,
                errors: [selectError.message]
            };
        }

        console.log('✅ SELECT fonctionne:');
        selectData?.forEach(op => {
            console.log(`  - ${op.nom} (${op.type}) - ${op.statut}`);
        });

        return {
            tableCreated: true,
            operateursInserted: totalOperateurs >= 5,
            selectWorks: true,
            totalOperateurs,
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
createOperateursSociauxTable().then(result => {
    console.log('\n📋 RAPPORT FINAL:');
    console.log(`✅/❌ Table créée: ${result.tableCreated ? '✅' : '❌'}`);
    console.log(`✅/❌ 5 opérateurs insérés: ${result.operateursInserted ? '✅' : '❌'}`);
    console.log(`✅/❌ SELECT fonctionne: ${result.selectWorks ? '✅' : '❌'}`);
    
    if (result.totalOperateurs) {
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