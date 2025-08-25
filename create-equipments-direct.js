const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgjatiookprsvfesrsrx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnamF0aW9va3Byc3ZmZXNyc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ1OTEwOSwiZXhwIjoyMDcxMDM1MTA5fQ.Yr-Mr8uLJBUdAsRE5W2C_29-bcC4tb82ACBsKRfRgps';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createEquipmentsSystem() {
    console.log('🚀 Création du système d\'équipements...');
    
    try {
        // 1. Créer d'abord la table equipments via une approche alternative
        console.log('📋 Création de la table equipments...');
        
        // On essaie de créer les tables via des requêtes directes
        const equipments = [
            {
                nom: 'WiFi Gratuit',
                nom_en: 'Free WiFi',
                description: 'Accès internet sans fil gratuit dans tout l\'établissement',
                description_en: 'Free wireless internet access throughout the property',
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
                description_en: 'Free on-site parking',
                icone: 'car',
                categorie: 'services',
                couleur: '#10B981',
                est_premium: false,
                ordre_affichage: 10
            },
            {
                nom: 'Piscine Intérieure',
                nom_en: 'Indoor Pool',
                description: 'Piscine couverte chauffée',
                description_en: 'Heated indoor swimming pool',
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
                description_en: 'On-site restaurant',
                icone: 'utensils',
                categorie: 'services',
                couleur: '#DC2626',
                est_premium: false,
                ordre_affichage: 30
            },
            {
                nom: 'Réception 24h/24',
                nom_en: '24h Reception',
                description: 'Accueil ouvert en permanence',
                description_en: 'Round-the-clock reception',
                icone: 'clock',
                categorie: 'services',
                couleur: '#1F2937',
                est_premium: false,
                ordre_affichage: 40
            },
            {
                nom: 'Accès PMR',
                nom_en: 'Wheelchair Access',
                description: 'Accès pour personnes à mobilité réduite',
                description_en: 'Wheelchair accessible',
                icone: 'wheelchair',
                categorie: 'accessibility',
                couleur: '#059669',
                est_premium: false,
                ordre_affichage: 50
            },
            {
                nom: 'Surveillance 24h/24',
                nom_en: '24h Security',
                description: 'Surveillance sécurisée permanente',
                description_en: 'Round-the-clock security surveillance',
                icone: 'shield',
                categorie: 'security',
                couleur: '#DC2626',
                est_premium: false,
                ordre_affichage: 60
            },
            {
                nom: 'Spa',
                nom_en: 'Spa',
                description: 'Centre de bien-être et détente',
                description_en: 'Wellness and relaxation center',
                icone: 'sparkles',
                categorie: 'wellness',
                couleur: '#EC4899',
                est_premium: true,
                ordre_affichage: 22
            },
            {
                nom: 'Bar',
                nom_en: 'Bar',
                description: 'Bar avec boissons variées',
                description_en: 'Bar with various beverages',
                icone: 'wine',
                categorie: 'services',
                couleur: '#7C3AED',
                est_premium: false,
                ordre_affichage: 31
            },
            {
                nom: 'Salle de Sport',
                nom_en: 'Fitness Center',
                description: 'Salle de fitness équipée',
                description_en: 'Fully equipped fitness center',
                icone: 'dumbbell',
                categorie: 'wellness',
                couleur: '#F97316',
                est_premium: true,
                ordre_affichage: 25
            }
        ];

        // Essayons de créer les équipements directement en utilisant l'API
        console.log('🔧 Tentative de création des équipements via API...');
        
        // D'abord, essayons de voir si les tables existent
        try {
            const { data: existingData, error: checkError } = await supabase
                .from('equipments')
                .select('id')
                .limit(1);
                
            if (checkError && checkError.code === 'PGRST116') {
                console.log('❌ Les tables n\'existent pas encore. Nous devons les créer manuellement via Supabase Dashboard.');
                console.log('');
                console.log('📝 INSTRUCTIONS POUR CRÉER LES TABLES MANUELLEMENT:');
                console.log('');
                console.log('1. Allez sur votre dashboard Supabase: https://supabase.com/dashboard/project/pgjatiookprsvfesrsrx');
                console.log('2. Cliquez sur "SQL Editor"');
                console.log('3. Copiez-collez le contenu du fichier: supabase/migrations/034_equipments_system.sql');
                console.log('4. Exécutez le script');
                console.log('');
                console.log('Ou utilisez la CLI Supabase:');
                console.log('npx supabase migration up');
                console.log('');
                
                return false;
            } else if (checkError) {
                console.log('❌ Erreur lors de la vérification des tables:', checkError.message);
                return false;
            } else {
                console.log('✅ Les tables existent déjà!');
                
                // Les tables existent, insérons les données
                for (const equipment of equipments) {
                    try {
                        const { data, error } = await supabase
                            .from('equipments')
                            .upsert(equipment, { onConflict: 'nom' })
                            .select();
                            
                        if (error) {
                            console.log(`❌ Erreur pour ${equipment.nom}:`, error.message);
                        } else {
                            console.log(`✅ Équipement créé: ${equipment.nom}`);
                        }
                    } catch (insertError) {
                        console.log(`❌ Erreur insertion ${equipment.nom}:`, insertError.message);
                    }
                }
                
                // Vérifier les données insérées
                const { data: finalData } = await supabase
                    .from('equipments')
                    .select('nom, categorie')
                    .order('categorie, ordre_affichage');
                    
                if (finalData) {
                    console.log('\n📋 Équipements créés:');
                    const groupedEquipments = finalData.reduce((acc, eq) => {
                        if (!acc[eq.categorie]) acc[eq.categorie] = [];
                        acc[eq.categorie].push(eq.nom);
                        return acc;
                    }, {});
                    
                    for (const [category, equipmentNames] of Object.entries(groupedEquipments)) {
                        console.log(`\n🏷️  ${category.toUpperCase()}:`);
                        equipmentNames.forEach(name => console.log(`   - ${name}`));
                    }
                }
                
                return true;
            }
        } catch (error) {
            console.log('❌ Erreur lors de la vérification:', error.message);
            return false;
        }
        
    } catch (error) {
        console.error('💥 Erreur fatale:', error.message);
        return false;
    }
}

// Exécuter le script
if (require.main === module) {
    createEquipmentsSystem()
        .then((success) => {
            if (success) {
                console.log('\n🎉 Système d\'équipements créé avec succès!');
            } else {
                console.log('\n⚠️  Création manuelle nécessaire via Supabase Dashboard');
            }
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Erreur fatale:', error);
            process.exit(1);
        });
}

module.exports = { createEquipmentsSystem };