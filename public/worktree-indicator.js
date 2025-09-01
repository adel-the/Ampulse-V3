// Worktree Indicator Script
// Affiche un badge pour indiquer le worktree actuel en mode développement

(function() {
    'use strict';
    
    // Dynamic Configuration - Will be set based on git-info API
    let WORKTREE_NAME = 'Master';
    let PORT = window.location.port || '3010';
    let COLOR = '#3B82F6'; // Blue-500 par défaut pour master
    
    // Détecter automatiquement le worktree/branche actuel
    async function detectWorktree() {
        try {
            const response = await fetch('/api/git-info');
            if (response.ok) {
                const data = await response.json();
                
                // Utiliser les données détectées
                if (data.worktree && data.worktree !== 'master') {
                    // Handle single-letter worktrees (F, I, M) differently from named ones
                    if (data.worktree.length === 1 && /[FIM]/.test(data.worktree)) {
                        WORKTREE_NAME = data.worktree.toUpperCase();
                    } else {
                        // Named worktrees like "Todo"
                        WORKTREE_NAME = data.worktree;
                    }
                } else if (data.branch === 'master') {
                    WORKTREE_NAME = 'Master';
                } else if (data.branch) {
                    WORKTREE_NAME = data.branch;
                }
                
                PORT = data.port || PORT;
                
                // Set color based on worktree
                switch (WORKTREE_NAME.toUpperCase()) {
                    case 'F':
                        COLOR = '#F59E0B'; // Amber-500
                        break;
                    case 'I':
                        COLOR = '#8B5CF6'; // Violet-500  
                        break;
                    case 'M':
                        COLOR = '#EF4444'; // Red-500
                        break;
                    case 'TODO':
                        COLOR = '#10B981'; // Emerald-500
                        break;
                    case 'MASTER':
                        COLOR = '#3B82F6'; // Blue-500
                        break;
                    default:
                        COLOR = '#6B7280'; // Gray-500 for unknown worktrees
                        break;
                }
                
                return true;
            }
        } catch (error) {
            console.log('Could not detect worktree, using defaults');
        }
        return false;
    }
    
    // Vérifier si on est en mode développement
    function isDevelopmentMode() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('.local');
    }
    
    // Créer l'indicateur de worktree
    function createWorktreeIndicator() {
        // Mettre à jour le titre de la page
        const originalTitle = document.title;
        document.title = `[${WORKTREE_NAME}] ${originalTitle}`;
        
        const indicator = document.createElement('div');
        indicator.id = 'worktree-indicator';
        
        // Styles inline pour éviter les conflits
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${COLOR};
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            cursor: pointer;
            transition: all 0.2s ease;
            user-select: none;
        `;
        
        // Contenu du badge
        indicator.innerHTML = `
            <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 8px; height: 8px; background: white; border-radius: 50%; animation: pulse 2s infinite;"></div>
                <span>${WORKTREE_NAME === 'Master' ? 'Master Branch' : `Worktree ${WORKTREE_NAME}`} - Port ${PORT}</span>
            </div>
        `;
        
        // Ajouter l'animation CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }
            #worktree-indicator:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
            }
        `;
        document.head.appendChild(style);
        
        // Événement click pour ouvrir le dashboard
        indicator.addEventListener('click', function() {
            window.open('/dev-dashboard', '_blank');
        });
        
        // Ajouter une tooltip
        indicator.title = 'Cliquez pour ouvrir le dashboard de développement';
        
        document.body.appendChild(indicator);
        
        // Animation d'entrée
        indicator.style.transform = 'translateX(100px)';
        indicator.style.opacity = '0';
        
        setTimeout(() => {
            indicator.style.transition = 'all 0.3s ease';
            indicator.style.transform = 'translateX(0)';
            indicator.style.opacity = '1';
        }, 100);
    }
    
    // Attendre que le DOM soit chargé
    async function init() {
        if (!isDevelopmentMode()) {
            return;
        }
        
        // D'abord détecter le worktree
        await detectWorktree();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createWorktreeIndicator);
        } else {
            createWorktreeIndicator();
        }
    }
    
    // Initialiser le script
    init();
    
    // Exposer des fonctions utiles dans la console pour le debug
    window.WorktreeIndicator = {
        version: '1.0.0',
        worktree: WORKTREE_NAME,
        port: PORT,
        show: function() {
            const indicator = document.getElementById('worktree-indicator');
            if (indicator) indicator.style.display = 'block';
        },
        hide: function() {
            const indicator = document.getElementById('worktree-indicator');
            if (indicator) indicator.style.display = 'none';
        },
        remove: function() {
            const indicator = document.getElementById('worktree-indicator');
            if (indicator) indicator.remove();
        },
        recreate: function() {
            this.remove();
            setTimeout(createWorktreeIndicator, 100);
        }
    };
})();