const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgjatiookprsvfesrsrx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnamF0aW9va3Byc3ZmZXNyc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ1OTEwOSwiZXhwIjoyMDcxMDM1MTA5fQ.Yr-Mr8uLJBUdAsRE5W2C_29-bcC4tb82ACBsKRfRgps';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validateEquipmentsSystem() {
    console.log('🔍 VALIDATION DU SYSTÈME D\'ÉQUIPEMENTS');
    console.log('=====================================\n');
    
    let validationResults = {
        tables: { equipments: false, hotel_equipments: false },
        data: { equipments: 0, categories: 0 },
        functions: { get_hotel_equipments: false, add_equipment_to_hotel: false },
        errors: []
    };
    
    try {
        // 1. Valider la table equipments
        console.log('📋 Validation de la table equipments...');
        const { data: equipments, error: equipError } = await supabase
            .from('equipments')
            .select('id, nom, categorie, est_premium, couleur, icone')
            .order('categorie, ordre_affichage');
            
        if (equipError) {
            console.log('❌ Table equipments non accessible:', equipError.message);
            validationResults.errors.push(`equipments table: ${equipError.message}`);
        } else {
            validationResults.tables.equipments = true;
            validationResults.data.equipments = equipments.length;
            console.log(`✅ Table equipments: ${equipments.length} équipements trouvés`);
            
            // Analyser les catégories
            const categories = [...new Set(equipments.map(eq => eq.categorie))];
            validationResults.data.categories = categories.length;
            console.log(`✅ Catégories: ${categories.join(', ')}`);
            
            // Afficher les équipements par catégorie
            console.log('\n📊 DÉTAIL DES ÉQUIPEMENTS:');
            const groupedEquipments = equipments.reduce((acc, eq) => {
                if (!acc[eq.categorie]) acc[eq.categorie] = [];
                acc[eq.categorie].push({
                    nom: eq.nom,
                    premium: eq.est_premium ? '💎' : '📋',
                    couleur: eq.couleur,
                    icone: eq.icone || '❓'
                });
                return acc;
            }, {});
            
            for (const [category, items] of Object.entries(groupedEquipments)) {
                console.log(`\n🏷️  ${category.toUpperCase()} (${items.length} équipements):`);
                items.forEach(item => {
                    console.log(`   ${item.premium} ${item.nom} ${item.icone ? '(' + item.icone + ')' : ''}`);
                });
            }
        }
        
        // 2. Valider la table hotel_equipments
        console.log('\n📋 Validation de la table hotel_equipments...');
        const { data: hotelEquipments, error: hotelEquipError } = await supabase
            .from('hotel_equipments')
            .select('id, hotel_id, equipment_id')
            .limit(10);
            
        if (hotelEquipError) {
            console.log('❌ Table hotel_equipments non accessible:', hotelEquipError.message);
            validationResults.errors.push(`hotel_equipments table: ${hotelEquipError.message}`);
        } else {
            validationResults.tables.hotel_equipments = true;
            console.log(`✅ Table hotel_equipments: ${hotelEquipments.length} associations trouvées`);
        }
        
        // 3. Tester les fonctions (si les tables existent)
        if (validationResults.tables.equipments && validationResults.tables.hotel_equipments) {
            console.log('\n⚙️ Test des fonctions utilitaires...');
            
            // Test get_hotel_equipments (peut échouer si la fonction n'existe pas)
            try {
                const { data: funcResult, error: funcError } = await supabase.rpc(
                    'get_hotel_equipments', 
                    { p_hotel_id: 1 }
                );
                
                if (funcError) {
                    console.log('⚠️  Fonction get_hotel_equipments non disponible:', funcError.message);
                } else {
                    validationResults.functions.get_hotel_equipments = true;
                    console.log('✅ Fonction get_hotel_equipments opérationnelle');
                }
            } catch (funcError) {
                console.log('⚠️  Fonction get_hotel_equipments:', funcError.message);
            }
        }
        
        // 4. Tester l'intégration avec les hôtels existants
        console.log('\n🏨 Test intégration avec les hôtels...');
        const { data: hotels, error: hotelsError } = await supabase
            .from('hotels')
            .select('id, nom')
            .limit(3);
            
        if (hotelsError) {
            console.log('❌ Impossible d\'accéder aux hôtels:', hotelsError.message);
            validationResults.errors.push(`hotels integration: ${hotelsError.message}`);
        } else {
            console.log(`✅ ${hotels.length} hôtels disponibles pour association d'équipements`);
            hotels.forEach(hotel => {
                console.log(`   - Hotel ID ${hotel.id}: ${hotel.nom}`);
            });
        }
        
        // 5. Résumé final
        console.log('\n🎯 RÉSUMÉ DE LA VALIDATION:');
        console.log('===========================');
        console.log(`✅ Tables créées: ${Object.values(validationResults.tables).filter(Boolean).length}/2`);
        console.log(`📊 Équipements: ${validationResults.data.equipments}`);
        console.log(`🏷️  Catégories: ${validationResults.data.categories}`);
        console.log(`⚙️ Fonctions: ${Object.values(validationResults.functions).filter(Boolean).length}/2`);
        console.log(`❌ Erreurs: ${validationResults.errors.length}`);
        
        if (validationResults.errors.length > 0) {
            console.log('\n❌ ERREURS DÉTECTÉES:');
            validationResults.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        // 6. Recommandations
        console.log('\n💡 RECOMMANDATIONS:');
        if (!validationResults.tables.equipments || !validationResults.tables.hotel_equipments) {
            console.log('🔴 CRITIQUE: Exécutez le script SQL supabase/migrations/034_equipments_system.sql');
            console.log('   via le Dashboard Supabase (SQL Editor)');
        } else {
            console.log('🟢 EXCELLENT: Système d\'équipements prêt à l\'utilisation!');
            console.log('   Vous pouvez commencer à associer des équipements aux hôtels.');
        }
        
        if (!validationResults.functions.get_hotel_equipments) {
            console.log('🟡 OPTIONNEL: Les fonctions utilitaires ne sont pas encore créées.');
            console.log('   Elles peuvent être ajoutées plus tard pour optimiser les performances.');
        }
        
        console.log('\n📖 DOCUMENTATION: Consultez EQUIPEMENTS_CREATION_RAPPORT.md');
        console.log('🔧 INTERFACE: Utilisez equipmentHelpers du fichier lib/supabase.ts');
        
        return validationResults;
        
    } catch (error) {
        console.error('\n💥 ERREUR CRITIQUE:', error.message);
        validationResults.errors.push(`Critical: ${error.message}`);
        return validationResults;
    }
}

// Fonction pour tester les helper functions TypeScript
async function testHelperFunctions() {
    console.log('\n🧪 TEST DES HELPER FUNCTIONS:');
    console.log('==============================');
    
    try {
        // Simuler l'importation des helpers (en pratique cela serait fait différemment)
        const { equipmentHelpers } = require('./lib/supabase.ts');
        
        // Test getAllEquipments
        console.log('🔍 Test equipmentHelpers.getAllEquipments()...');
        // Cette partie serait testée dans un environnement Next.js réel
        console.log('⚠️  Tests des helpers nécessitent un environnement Next.js/TypeScript');
        
    } catch (error) {
        console.log('⚠️  Helper functions testing requiert compilation TypeScript');
    }
}

// Exécution
if (require.main === module) {
    validateEquipmentsSystem()
        .then((results) => {
            const success = results.tables.equipments && results.tables.hotel_equipments;
            console.log(`\n${success ? '🎉' : '⚠️'} VALIDATION ${success ? 'RÉUSSIE' : 'PARTIELLE'}`);
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('\n💥 VALIDATION ÉCHOUÉE:', error);
            process.exit(1);
        });
}

module.exports = { validateEquipmentsSystem };