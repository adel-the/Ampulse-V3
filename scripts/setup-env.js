#!/usr/bin/env node

/**
 * WORKTREE M - ENVIRONMENT SETUP SCRIPT
 * 
 * Ce script aide à configurer l'environnement pour le worktree M
 * Il copie le template .env.local.example vers .env.local et guide l'utilisateur
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const ENV_EXAMPLE = '.env.local.example';
const ENV_LOCAL = '.env.local';
const WORKTREE_NAME = 'M';

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
    console.log(colorize('  WORKTREE M - ENVIRONMENT SETUP', 'bright'));
    console.log(colorize('='.repeat(60), 'cyan'));
}

function logSuccess(message) {
    console.log(colorize(`✓ ${message}`, 'green'));
}

function logError(message) {
    console.log(colorize(`✗ ${message}`, 'red'));
}

function logInfo(message) {
    console.log(colorize(`ℹ ${message}`, 'blue'));
}

function logWarning(message) {
    console.log(colorize(`⚠ ${message}`, 'yellow'));
}

/**
 * Vérifie l'existence des fichiers nécessaires
 */
function checkFiles() {
    const exampleExists = fs.existsSync(ENV_EXAMPLE);
    const localExists = fs.existsSync(ENV_LOCAL);
    
    return { exampleExists, localExists };
}

/**
 * Copie le fichier d'exemple
 */
function copyExampleFile() {
    try {
        const content = fs.readFileSync(ENV_EXAMPLE, 'utf8');
        fs.writeFileSync(ENV_LOCAL, content);
        logSuccess(`Fichier ${ENV_LOCAL} créé avec succès`);
        return true;
    } catch (error) {
        logError(`Erreur lors de la copie: ${error.message}`);
        return false;
    }
}

/**
 * Affiche les instructions de configuration
 */
function showConfigurationInstructions() {
    console.log('\n' + colorize('Configuration requise:', 'bright'));
    console.log(colorize('-'.repeat(40), 'cyan'));
    
    logInfo('1. Ouvrez le fichier .env.local dans votre éditeur');
    logInfo('2. Remplacez les valeurs suivantes par vos credentials Supabase:');
    
    console.log(colorize('   • NEXT_PUBLIC_SUPABASE_URL', 'yellow'));
    console.log(colorize('   • NEXT_PUBLIC_SUPABASE_ANON_KEY', 'yellow'));
    console.log(colorize('   • SUPABASE_SERVICE_ROLE_KEY', 'yellow'));
    
    logInfo('3. Les autres variables sont déjà configurées pour le worktree M');
    
    console.log('\n' + colorize('Où trouver vos credentials Supabase:', 'bright'));
    console.log(colorize('-'.repeat(40), 'cyan'));
    logInfo('• Connectez-vous à https://app.supabase.com');
    logInfo('• Sélectionnez votre projet');
    logInfo('• Allez dans Settings > API');
    logInfo('• Copiez les clés depuis cette page');
}

/**
 * Fonction principale
 */
async function main() {
    logHeader();
    
    // Vérifier les fichiers
    const { exampleExists, localExists } = checkFiles();
    
    if (!exampleExists) {
        logError(`Fichier ${ENV_EXAMPLE} introuvable`);
        logError('Ce script doit être exécuté depuis le répertoire du worktree M');
        process.exit(1);
    }
    
    if (localExists) {
        logWarning(`Le fichier ${ENV_LOCAL} existe déjà`);
        
        // Demander confirmation pour écraser
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const answer = await new Promise((resolve) => {
            rl.question(colorize('Voulez-vous l\'écraser ? (y/N): ', 'yellow'), resolve);
        });
        
        rl.close();
        
        if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
            logInfo('Opération annulée');
            process.exit(0);
        }
        
        // Sauvegarder l'ancien fichier
        const backupFile = `${ENV_LOCAL}.backup.${Date.now()}`;
        fs.copyFileSync(ENV_LOCAL, backupFile);
        logInfo(`Ancien fichier sauvegardé dans ${backupFile}`);
    }
    
    // Copier le fichier d'exemple
    if (copyExampleFile()) {
        showConfigurationInstructions();
        
        console.log('\n' + colorize('Prochaines étapes:', 'bright'));
        console.log(colorize('-'.repeat(40), 'cyan'));
        logInfo('1. Éditez .env.local avec vos credentials');
        logInfo('2. Testez la configuration: npm run check:worktree');
        logInfo('3. Démarrez le serveur: npm run dev');
        logInfo('4. Ouvrez http://localhost:3010');
        
        console.log('\n' + colorize('✅ Configuration initiale terminée !', 'green'));
        console.log(colorize('='.repeat(60), 'cyan') + '\n');
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    main().catch(error => {
        logError(`Erreur inattendue: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { main, checkFiles, copyExampleFile };