const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgjatiookprsvfesrsrx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnamF0aW9va3Byc3ZmZXNyc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ1OTEwOSwiZXhwIjoyMDcxMDM1MTA5fQ.Yr-Mr8uLJBUdAsRE5W2C_29-bcC4tb82ACBsKRfRgps';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createEquipmentsTable() {
    console.log('🚀 Création de la table equipments...');
    
    try {
        // Utilisons l'API REST de Supabase pour créer la table via une fonction
        const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.equipments (
            id BIGSERIAL PRIMARY KEY,
            nom VARCHAR(100) NOT NULL UNIQUE,
            nom_en VARCHAR(100) NULL,
            description TEXT NULL,
            description_en TEXT NULL,
            icone VARCHAR(50) NULL,
            categorie VARCHAR(50) NOT NULL DEFAULT 'general',
            couleur VARCHAR(7) NULL DEFAULT '#3B82F6',
            est_premium BOOLEAN NOT NULL DEFAULT false,
            ordre_affichage INTEGER NOT NULL DEFAULT 0,
            est_actif BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        `;

        // Essayons avec une requête RPC (Remote Procedure Call)
        const { data: rpcResult, error: rpcError } = await supabase.rpc('exec', { 
            sql: createTableSQL 
        });
        
        if (rpcError) {
            console.log('❌ RPC exec failed:', rpcError.message);
            
            // Essayons une approche alternative avec l'API Edge Functions
            try {
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'apikey': supabaseServiceKey
                    },
                    body: JSON.stringify({ sql: createTableSQL })
                });
                
                if (!response.ok) {
                    console.log('❌ REST API failed:', response.statusText);
                    console.log('');
                    console.log('📝 SOLUTION ALTERNATIVE:');
                    console.log('Veuillez créer les tables manuellement via le Dashboard Supabase:');
                    console.log('1. Allez sur: https://supabase.com/dashboard/project/pgjatiookprsvfesrsrx');
                    console.log('2. Cliquez sur "SQL Editor"');
                    console.log('3. Copiez le contenu du fichier: supabase/migrations/034_equipments_system.sql');
                    console.log('4. Exécutez le script');
                    return false;
                }
                
                const result = await response.json();
                console.log('✅ Table equipments créée via REST API');
                
            } catch (fetchError) {
                console.log('❌ Fetch error:', fetchError.message);
                return false;
            }
        } else {
            console.log('✅ Table equipments créée via RPC');
        }
        
        // Maintenant créons la table hotel_equipments
        console.log('📋 Création de la table hotel_equipments...');
        
        const createJunctionTableSQL = `
        CREATE TABLE IF NOT EXISTS public.hotel_equipments (
            id BIGSERIAL PRIMARY KEY,
            hotel_id BIGINT NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
            equipment_id BIGINT NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
            est_disponible BOOLEAN NOT NULL DEFAULT true,
            est_gratuit BOOLEAN NOT NULL DEFAULT true,
            prix_supplement DECIMAL(10,2) NULL,
            description_specifique TEXT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(hotel_id, equipment_id)
        );
        `;
        
        // Tentative de création de la table de jonction
        try {
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'apikey': supabaseServiceKey
                },
                body: JSON.stringify({ sql: createJunctionTableSQL })
            });
            
            if (response.ok) {
                console.log('✅ Table hotel_equipments créée');
            }
        } catch (error) {
            console.log('❌ Erreur création hotel_equipments:', error.message);
        }
        
        return true;
        
    } catch (error) {
        console.error('💥 Erreur fatale lors de la création des tables:', error.message);
        return false;
    }
}

async function insertEquipments() {
    console.log('📝 Insertion des équipements de base...');
    
    const equipments = [
        {
            nom: 'WiFi Gratuit',
            nom_en: 'Free WiFi',
            description: 'Accès internet sans fil gratuit',
            icone: 'wifi',
            categorie: 'connectivity',
            couleur: '#10B981',
            est_premium: false,
            ordre_affichage: 1
        },
        {
            nom: 'Parking Gratuit',
            nom_en: 'Free Parking',
            description: 'Stationnement gratuit sur place',
            icone: 'car',
            categorie: 'services',
            couleur: '#10B981',
            est_premium: false,
            ordre_affichage: 10
        },
        {
            nom: 'Piscine',
            nom_en: 'Pool',
            description: 'Piscine pour la détente',
            icone: 'waves',
            categorie: 'wellness',
            couleur: '#0EA5E9',
            est_premium: true,
            ordre_affichage: 20
        },
        {
            nom: 'Restaurant',
            nom_en: 'Restaurant',
            description: 'Restaurant sur place',
            icone: 'utensils',
            categorie: 'services',
            couleur: '#DC2626',
            est_premium: false,
            ordre_affichage: 30
        },
        {
            nom: 'Spa',
            nom_en: 'Spa',
            description: 'Centre de bien-être',
            icone: 'sparkles',
            categorie: 'wellness',
            couleur: '#EC4899',
            est_premium: true,
            ordre_affichage: 21
        },
        {
            nom: 'Accès PMR',
            nom_en: 'Wheelchair Access',
            description: 'Accès personnes à mobilité réduite',
            icone: 'wheelchair',
            categorie: 'accessibility',
            couleur: '#059669',
            est_premium: false,
            ordre_affichage: 50
        }
    ];
    
    try {
        for (const equipment of equipments) {
            try {
                const { data, error } = await supabase
                    .from('equipments')
                    .insert(equipment)
                    .select();
                    
                if (error && !error.message.includes('duplicate key')) {
                    console.log(`❌ Erreur pour ${equipment.nom}:`, error.message);
                } else {
                    console.log(`✅ ${equipment.nom} ajouté`);
                }
            } catch (insertError) {
                if (!insertError.message.includes('duplicate key')) {
                    console.log(`❌ Erreur ${equipment.nom}:`, insertError.message);
                }
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Erreur insertion équipements:', error.message);
        return false;
    }
}

async function verifyCreation() {
    console.log('\n🔍 Vérification des tables créées...');
    
    try {
        // Vérifier equipments
        const { data: equipments, error: eqError } = await supabase
            .from('equipments')
            .select('nom, categorie')
            .order('categorie, ordre_affichage');
            
        if (eqError) {
            console.log('❌ Table equipments non accessible:', eqError.message);
            return false;
        }
        
        console.log(`✅ Table equipments: ${equipments.length} équipements`);
        
        // Grouper par catégorie
        if (equipments.length > 0) {
            const grouped = equipments.reduce((acc, eq) => {
                if (!acc[eq.categorie]) acc[eq.categorie] = [];
                acc[eq.categorie].push(eq.nom);
                return acc;
            }, {});
            
            console.log('\n📋 Équipements par catégorie:');
            for (const [cat, names] of Object.entries(grouped)) {
                console.log(`🏷️  ${cat}: ${names.join(', ')}`);
            }
        }
        
        // Vérifier hotel_equipments
        const { error: heError } = await supabase
            .from('hotel_equipments')
            .select('id')
            .limit(1);
            
        if (heError) {
            console.log('❌ Table hotel_equipments non accessible:', heError.message);
        } else {
            console.log('✅ Table hotel_equipments accessible');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Erreur vérification:', error.message);
        return false;
    }
}

// Exécuter tout
async function main() {
    console.log('🎯 Création complète du système d\'équipements\n');
    
    const tablesCreated = await createEquipmentsTable();
    
    if (tablesCreated) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2 secondes
        const equipmentsInserted = await insertEquipments();
        
        if (equipmentsInserted) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde
            await verifyCreation();
        }
    }
    
    console.log('\n🎉 Processus terminé');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { createEquipmentsTable, insertEquipments, verifyCreation };