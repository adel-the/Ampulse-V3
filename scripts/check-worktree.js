#!/usr/bin/env node

/**
 * WORKTREE M - PROTECTION SCRIPT
 * 
 * Ce script vérifie et protège le worktree M contre les erreurs courantes :
 * - Vérification qu'on est bien dans le worktree M
 * - Protection contre les commits accidentels sur master
 * - Validation de la configuration d'environnement
 * - Affichage de warnings si tentative de changement de worktree
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration du worktree M
const WORKTREE_CONFIG = {
    name: 'M',
    expectedPath: 'M',
    port: 3010,
    color: '#10B981',
    description: 'Maintenance and System Management'
};

// Couleurs pour les messages console
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    bright: '\x1b[1m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

function logHeader() {
    console.log('\n' + colorize('='.repeat(60), 'cyan'));
    console.log(colorize('  WORKTREE M - PROTECTION & VERIFICATION SCRIPT', 'bright'));
    console.log(colorize('='.repeat(60), 'cyan'));
}

function logSection(title) {
    console.log('\n' + colorize(`▶ ${title}`, 'blue'));
    console.log(colorize('-'.repeat(40), 'blue'));
}

function logSuccess(message) {
    console.log(colorize(`✓ ${message}`, 'green'));
}

function logWarning(message) {
    console.log(colorize(`⚠ ${message}`, 'yellow'));
}

function logError(message) {
    console.log(colorize(`✗ ${message}`, 'red'));
}

function logInfo(message) {
    console.log(colorize(`ℹ ${message}`, 'blue'));
}

/**
 * Vérifie si on est dans le bon worktree
 */
function checkWorktreeLocation() {
    logSection('Vérification de l\'emplacement du worktree');
    
    const currentPath = process.cwd();
    const expectedPath = path.resolve(currentPath);
    
    logInfo(`Répertoire courant: ${currentPath}`);
    
    // Vérifier si on est dans le répertoire M
    if (!currentPath.includes(WORKTREE_CONFIG.expectedPath)) {
        logError(`Vous n'êtes pas dans le worktree ${WORKTREE_CONFIG.name} !`);
        logError(`Répertoire attendu: .../${WORKTREE_CONFIG.expectedPath}/`);
        logError(`Répertoire actuel: ${currentPath}`);
        return false;
    }
    
    logSuccess(`Vous êtes bien dans le worktree ${WORKTREE_CONFIG.name}`);
    return true;
}

/**
 * Vérifie la configuration Git du worktree
 */
function checkGitConfiguration() {
    logSection('Vérification de la configuration Git');
    
    try {
        // Vérifier si c'est un repo Git
        const isGitRepo = fs.existsSync('.git');
        if (!isGitRepo) {
            logError('Ce répertoire n\'est pas un repository Git valide');
            return false;
        }
        
        // Obtenir la branche courante
        const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
        logInfo(`Branche courante: ${currentBranch}`);
        
        // Vérifier le statut du worktree
        const worktreeList = execSync('git worktree list', { encoding: 'utf8' });
        logInfo('Liste des worktrees:');
        worktreeList.split('\n').forEach(line => {
            if (line.trim()) {
                const isCurrent = line.includes(process.cwd());
                const marker = isCurrent ? '→ ' : '  ';
                console.log(colorize(`${marker}${line}`, isCurrent ? 'green' : 'cyan'));
            }
        });
        
        logSuccess('Configuration Git validée');
        return true;
        
    } catch (error) {
        logError(`Erreur lors de la vérification Git: ${error.message}`);
        return false;
    }
}

/**
 * Protection contre les commits sur master
 */
function checkMasterProtection() {
    logSection('Protection contre les commits sur master');
    
    try {
        const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
        
        if (currentBranch === 'master' || currentBranch === 'main') {
            logWarning('⚠⚠⚠ ATTENTION: Vous êtes sur la branche master ! ⚠⚠⚠');
            logWarning('');
            logWarning('Il est fortement déconseillé de committer directement sur master.');
            logWarning('Recommandations:');
            logWarning('1. Créer une branche de feature: git checkout -b feature/nom-feature');
            logWarning('2. Faire vos commits sur cette branche');
            logWarning('3. Créer une pull request pour merger sur master');
            logWarning('');
            
            // Vérifier s'il y a des changements en attente
            const status = execSync('git status --porcelain', { encoding: 'utf8' });
            if (status.trim()) {
                logError('⛔ COMMIT BLOQUÉ: Changements détectés sur master');
                logError('Veuillez créer une branche avant de committer:');
                logError('git checkout -b feature/votre-feature-name');
                return false;
            } else {
                logInfo('Aucun changement en attente sur master');
            }
        } else {
            logSuccess(`Vous êtes sur la branche '${currentBranch}' (sécurisé)`);
        }
        
        return true;
        
    } catch (error) {
        logError(`Erreur lors de la vérification de la branche: ${error.message}`);
        return false;
    }
}

/**
 * Vérifie la configuration d'environnement
 */
function checkEnvironmentConfiguration() {
    logSection('Vérification de la configuration d\'environnement');
    
    // Vérifier .env.local
    const envLocalExists = fs.existsSync('.env.local');
    if (!envLocalExists) {
        logWarning('Fichier .env.local manquant');
        logWarning('Copiez .env.local.example vers .env.local et configurez vos credentials');
        logWarning('cp .env.local.example .env.local');
    } else {
        logSuccess('Fichier .env.local trouvé');
        
        // Vérifier le contenu
        const envContent = fs.readFileSync('.env.local', 'utf8');
        
        // Vérifier le port
        const portMatch = envContent.match(/PORT=(\d+)/);
        if (portMatch) {
            const port = parseInt(portMatch[1]);
            if (port === WORKTREE_CONFIG.port) {
                logSuccess(`Port configuré correctement: ${port}`);
            } else {
                logWarning(`Port configuré: ${port}, attendu: ${WORKTREE_CONFIG.port}`);
            }
        } else {
            logWarning('Variable PORT non trouvée dans .env.local');
        }
        
        // Vérifier le nom du worktree
        const worktreeMatch = envContent.match(/WORKTREE_NAME=([A-Z]+)/);
        if (worktreeMatch) {
            const worktreeName = worktreeMatch[1];
            if (worktreeName === WORKTREE_CONFIG.name) {
                logSuccess(`Worktree configuré correctement: ${worktreeName}`);
            } else {
                logWarning(`Worktree configuré: ${worktreeName}, attendu: ${WORKTREE_CONFIG.name}`);
            }
        } else {
            logWarning('Variable WORKTREE_NAME non trouvée dans .env.local');
        }
    }
    
    // Vérifier .env.local.example
    const envExampleExists = fs.existsSync('.env.local.example');
    if (envExampleExists) {
        logSuccess('Template .env.local.example disponible');
    } else {
        logError('Template .env.local.example manquant');
    }
    
    return envLocalExists;
}

/**
 * Affiche les informations du worktree
 */
function displayWorktreeInfo() {
    logSection('Informations du worktree M');
    
    console.log(colorize(`Nom: ${WORKTREE_CONFIG.name}`, 'bright'));
    console.log(colorize(`Description: ${WORKTREE_CONFIG.description}`, 'cyan'));
    console.log(colorize(`Port: ${WORKTREE_CONFIG.port}`, 'green'));
    console.log(colorize(`Couleur: ${WORKTREE_CONFIG.color}`, 'magenta'));
    
    logInfo('Commandes utiles:');
    console.log(colorize('  npm run dev                 # Démarrer le serveur (port 3010)', 'cyan'));
    console.log(colorize('  npm run build               # Build pour production', 'cyan'));
    console.log(colorize('  npm run test:maintenance    # Tests de maintenance', 'cyan'));
    console.log(colorize('  npm run validate:system     # Validation système', 'cyan'));
}

/**
 * Warnings pour changement de worktree
 */
function displayWorktreeWarnings() {
    logSection('Avertissements et bonnes pratiques');
    
    logWarning('⚠ Ne pas mélanger les worktrees:');
    console.log(colorize('  • M (port 3010): Maintenance et administration', 'yellow'));
    console.log(colorize('  • F (port 3011): Nouvelles fonctionnalités', 'yellow'));
    console.log(colorize('  • I (port 3012): Tests d\'intégration', 'yellow'));
    
    logWarning('⚠ Avant de changer de worktree:');
    console.log(colorize('  • Commitez ou stash vos changements', 'yellow'));
    console.log(colorize('  • Vérifiez qu\'aucun serveur ne tourne', 'yellow'));
    console.log(colorize('  • Utilisez le bon port dans le nouveau worktree', 'yellow'));
    
    logInfo('Documentation complète dans WORKTREE_M_CONFIG.md');
}

/**
 * Fonction principale
 */
function main() {
    logHeader();
    
    let allChecksPassed = true;
    
    // Exécuter toutes les vérifications
    allChecksPassed &= checkWorktreeLocation();
    allChecksPassed &= checkGitConfiguration();
    allChecksPassed &= checkMasterProtection();
    allChecksPassed &= checkEnvironmentConfiguration();
    
    // Afficher les informations
    displayWorktreeInfo();
    displayWorktreeWarnings();
    
    // Résultat final
    console.log('\n' + colorize('='.repeat(60), 'cyan'));
    if (allChecksPassed) {
        logSuccess('✅ Toutes les vérifications sont passées avec succès !');
        logSuccess('Vous pouvez travailler en sécurité dans le worktree M');
    } else {
        logError('❌ Certaines vérifications ont échoué');
        logError('Veuillez corriger les problèmes avant de continuer');
    }
    console.log(colorize('='.repeat(60), 'cyan') + '\n');
    
    // Code de sortie
    process.exit(allChecksPassed ? 0 : 1);
}

// Gestion des arguments de ligne de commande
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log('Usage: node check-worktree.js [options]');
        console.log('');
        console.log('Options:');
        console.log('  --help, -h     Afficher cette aide');
        console.log('  --info, -i     Afficher seulement les informations');
        console.log('  --quiet, -q    Mode silencieux (erreurs uniquement)');
        console.log('');
        console.log('Ce script vérifie la configuration du worktree M et protège');
        console.log('contre les erreurs courantes de développement.');
        process.exit(0);
    }
    
    if (args.includes('--info') || args.includes('-i')) {
        displayWorktreeInfo();
        process.exit(0);
    }
    
    main();
}

module.exports = {
    checkWorktreeLocation,
    checkGitConfiguration, 
    checkMasterProtection,
    checkEnvironmentConfiguration,
    WORKTREE_CONFIG
};