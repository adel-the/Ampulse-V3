// Worktree Indicator Script
// Affiche un badge pour indiquer le worktree actuel en mode développement

(function() {
    'use strict';
    
    // Détection dynamique du port et du worktree
    function detectWorktreeInfo() {
        const currentPort = window.location.port || '3000';
        let worktreeName = 'Master';
        let color = '#3B82F6'; // Blue-500 par défaut pour master
        
        // Détection basée sur le port
        if (currentPort >= '3000' && currentPort <= '3005') {
            worktreeName = 'Master';
            color = '#3B82F6'; // Blue-500
        } else if (currentPort >= '3010' && currentPort <= '3015') {
            worktreeName = 'M';
            color = '#10B981'; // Emerald-500
        } else if (currentPort >= '3020' && currentPort <= '3025') {
            worktreeName = 'F';
            color = '#8B5CF6'; // Purple-500
        } else if (currentPort >= '3001' && currentPort <= '3009') {
            worktreeName = 'I';
            color = '#F97316'; // Orange-500
        }
        
        return {
            name: worktreeName,
            port: currentPort,
            color: color
        };
    }
    
    // Configuration dynamique
    const worktreeInfo = detectWorktreeInfo();
    const WORKTREE_NAME = worktreeInfo.name;
    const PORT = worktreeInfo.port;
    const COLOR = worktreeInfo.color;
    
    // Vérifier si on est en mode développement
    function isDevelopmentMode() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('.local');
    }
    
    // Créer l'indicateur de worktree
    function createWorktreeIndicator() {
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
        const displayName = WORKTREE_NAME === 'Master' ? 'Master Branch' : `Worktree ${WORKTREE_NAME}`;
        indicator.innerHTML = `
            <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 8px; height: 8px; background: white; border-radius: 50%; animation: pulse 2s infinite;"></div>
                <span>${displayName} - Port ${PORT}</span>
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
    function init() {
        if (!isDevelopmentMode()) {
            return;
        }
        
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