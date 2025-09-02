// Script à coller dans la console du navigateur sur http://localhost:3012/debug-maintenance
// pour tester directement l'API de maintenance

console.log('🧪 Debug API Maintenance dans le navigateur');
console.log('============================================');

// Fonction pour tester l'importation et l'utilisation des modules
async function debugMaintenanceAPI() {
    try {
        console.log('1. Test d\'importation des modules...');
        
        // Vérifier si les modules Next.js sont disponibles
        if (typeof window !== 'undefined' && window.__NEXT_DATA__) {
            console.log('✅ Environnement Next.js détecté');
            console.log('App data:', window.__NEXT_DATA__);
        }
        
        // Tenter d'importer le module Supabase depuis la page
        console.log('2. Test Supabase depuis les modules globaux...');
        
        // Dans le contexte de l'application, les modules peuvent être accessibles différemment
        // Essayons de créer une tâche en utilisant la logique existante
        
        console.log('3. Simulation de création de tâche...');
        
        const testTaskData = {
            titre: 'DEBUG BROWSER - ' + new Date().toISOString(),
            description: 'Test depuis la console du navigateur',
            priorite: 'moyenne',
            responsable: 'Console User',
            room_id: 10
        };
        
        console.log('📝 Données de test:', testTaskData);
        
        // Si React est disponible, essayer d'accéder aux hooks ou composants
        if (typeof React !== 'undefined') {
            console.log('✅ React disponible');
        }
        
        // Essayer d'accéder aux éléments DOM de la page pour comprendre l'état
        const addButton = document.querySelector('button[disabled]');
        if (addButton) {
            console.log('🔍 Bouton "Nouvelle tâche" trouvé:', addButton);
            console.log('   - Désactivé:', addButton.disabled);
            console.log('   - Texte:', addButton.textContent);
        }
        
        // Vérifier l'état de chargement
        const loadingElements = document.querySelectorAll('[class*="animate-spin"], [class*="loader"]');
        if (loadingElements.length > 0) {
            console.log('⏳ Éléments de chargement détectés:', loadingElements.length);
            loadingElements.forEach((el, i) => {
                console.log(`   ${i + 1}. ${el.className} - ${el.textContent}`);
            });
        }
        
        // Vérifier les erreurs dans la console
        const errorElements = document.querySelectorAll('[class*="error"], [class*="danger"]');
        if (errorElements.length > 0) {
            console.log('❌ Éléments d\'erreur détectés:', errorElements.length);
            errorElements.forEach((el, i) => {
                console.log(`   ${i + 1}. ${el.className} - ${el.textContent}`);
            });
        }
        
        // Essayer d'accéder aux variables globales de l'app
        console.log('4. Variables globales disponibles:');
        const globals = ['supabase', 'supabaseAdmin', '__NEXT_DATA__', 'React'];
        globals.forEach(global => {
            console.log(`   ${global}:`, typeof window[global] !== 'undefined' ? '✅ Disponible' : '❌ Non disponible');
        });
        
        console.log('5. Test d\'accès direct aux APIs...');
        
        // Essayer de faire un fetch vers une API locale inexistante pour voir l'erreur
        try {
            const response = await fetch('/api/maintenance/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testTaskData)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ API route fonctionne:', result);
            } else {
                console.log('❌ API route non trouvée:', response.status);
                const text = await response.text();
                console.log('Réponse:', text.substring(0, 200));
            }
        } catch (fetchError) {
            console.log('❌ Erreur fetch API route:', fetchError.message);
        }
        
        console.log('6. État des modules dans la page...');
        
        // Essayer d'accéder aux modules via les script tags
        const scriptTags = document.querySelectorAll('script[src]');
        console.log(`📄 ${scriptTags.length} scripts chargés dans la page`);
        
        const relevantScripts = Array.from(scriptTags).filter(script => {
            const src = script.src;
            return src.includes('supabase') || 
                   src.includes('maintenance') || 
                   src.includes('api') ||
                   src.includes('chunk');
        });
        
        if (relevantScripts.length > 0) {
            console.log('🎯 Scripts pertinents:', relevantScripts.map(s => s.src));
        }
        
    } catch (error) {
        console.error('❌ Erreur générale debug:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Fonction pour analyser les erreurs réseau
function analyzeNetworkErrors() {
    console.log('🌐 Analyse des erreurs réseau...');
    
    // Override fetch pour intercepter les erreurs
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        try {
            const response = await originalFetch(...args);
            if (!response.ok) {
                console.log(`🔍 Requête échouée: ${args[0]} - ${response.status}`);
            }
            return response;
        } catch (error) {
            console.error(`🔍 Erreur fetch interceptée: ${args[0]}`, error);
            throw error;
        }
    };
    
    console.log('✅ Intercepteur fetch installé');
}

// Fonction pour forcer un test de création
async function forceTestCreation() {
    console.log('🚀 Test forcé de création de tâche...');
    
    try {
        // Créer un client Supabase directement
        if (typeof window.supabase === 'undefined' && typeof window.__SUPABASE_CLIENT__ === 'undefined') {
            // Importer Supabase depuis CDN si nécessaire
            if (typeof window.createClient === 'undefined') {
                console.log('📦 Chargement de Supabase depuis CDN...');
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                document.head.appendChild(script);
                
                await new Promise(resolve => {
                    script.onload = resolve;
                });
            }
        }
        
        // Configurer le client avec les credentials locales
        const supabaseLocal = window.supabase?.createClient?.(
            'http://127.0.0.1:15421',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
        );
        
        if (supabaseLocal) {
            console.log('✅ Client Supabase local créé');
            
            const taskData = {
                titre: 'FORCE TEST - ' + new Date().toISOString(),
                description: 'Test forcé depuis la console',
                priorite: 'moyenne',
                statut: 'en_attente',
                hotel_id: 1,
                room_id: 10,
                user_owner_id: 'c8c827c4-419f-409c-a696-e6bf0856984b',
                created_by: 'c8c827c4-419f-409c-a696-e6bf0856984b'
            };
            
            const { data, error } = await supabaseLocal
                .from('maintenance_tasks')
                .insert(taskData)
                .select()
                .single();
            
            if (error) {
                console.error('❌ Erreur test forcé:', error);
            } else {
                console.log('✅ Test forcé réussi!', data);
                
                // Nettoyer
                setTimeout(async () => {
                    await supabaseLocal
                        .from('maintenance_tasks')
                        .delete()
                        .eq('id', data.id);
                    console.log('🧹 Tâche de test supprimée');
                }, 3000);
            }
        } else {
            console.error('❌ Impossible de créer le client Supabase');
        }
        
    } catch (error) {
        console.error('❌ Erreur test forcé:', error);
    }
}

// Exécuter les tests
debugMaintenanceAPI();
analyzeNetworkErrors();

// Fonctions disponibles pour tests manuels
window.debugMaintenanceAPI = debugMaintenanceAPI;
window.forceTestCreation = forceTestCreation;

console.log('🎯 Tests disponibles:');
console.log('  - debugMaintenanceAPI() : Analyse complète');
console.log('  - forceTestCreation() : Test forcé avec Supabase direct');