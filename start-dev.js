#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

// Configuration du worktree M
const WORKTREE_NAME = 'M';
const DEFAULT_PORT = 3010;
const ALLOWED_PORTS = [3010, 3011, 3012, 3013, 3014, 3015];
const WORKTREE_COLOR = '\x1b[32m'; // Vert pour M
const RESET_COLOR = '\x1b[0m';

/**
 * Vérifie si un port est libre
 */
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Trouve le premier port libre dans la plage autorisée
 */
async function findFreePort() {
  for (const port of ALLOWED_PORTS) {
    if (await isPortFree(port)) {
      return port;
    }
  }
  return null;
}

/**
 * Détecte si on est dans le worktree M
 */
function detectWorktree() {
  const currentDir = process.cwd();
  const worktreePath = path.basename(currentDir);
  
  // Vérifier si on est dans le dossier M
  if (worktreePath === 'M') {
    return true;
  }
  
  // Vérifier si le fichier .git contient une référence au worktree
  const gitPath = path.join(currentDir, '.git');
  if (fs.existsSync(gitPath)) {
    const gitContent = fs.readFileSync(gitPath, 'utf8');
    if (gitContent.includes('worktrees') && gitContent.includes('/M')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Affiche un message stylisé
 */
function logMessage(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[${WORKTREE_COLOR}${WORKTREE_NAME}${RESET_COLOR}] ${timestamp}`;
  
  switch (type) {
    case 'success':
      console.log(`${prefix} ${WORKTREE_COLOR}✓${RESET_COLOR} ${message}`);
      break;
    case 'error':
      console.log(`${prefix} \x1b[31m✗${RESET_COLOR} ${message}`);
      break;
    case 'warning':
      console.log(`${prefix} \x1b[33m⚠${RESET_COLOR} ${message}`);
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
}

/**
 * Lance le serveur de développement
 */
async function startDevelopmentServer() {
  try {
    // Vérifier qu'on est dans le bon worktree
    if (!detectWorktree()) {
      logMessage('Erreur: Ce script doit être exécuté depuis le worktree M', 'error');
      process.exit(1);
    }
    
    logMessage(`Démarrage du serveur de développement pour le worktree ${WORKTREE_NAME}...`);
    
    // Trouver un port libre
    const port = await findFreePort();
    
    if (!port) {
      logMessage('Erreur: Aucun port disponible dans la plage 3010-3015', 'error');
      process.exit(1);
    }
    
    if (port !== DEFAULT_PORT) {
      logMessage(`Port ${DEFAULT_PORT} occupé, utilisation du port ${port}`, 'warning');
    }
    
    logMessage(`Vérification du port ${port}... OK`);
    
    // Lancer Next.js
    const nextProcess = spawn('npm', ['run', 'dev', '--', '--port', port.toString()], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true
    });
    
    let serverReady = false;
    
    // Capturer la sortie stdout
    nextProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      
      // Détecter quand le serveur est prêt
      if (output.includes('Ready in') || output.includes('ready - started server')) {
        if (!serverReady) {
          serverReady = true;
          
          // Messages de succès
          console.log('\n' + '='.repeat(60));
          logMessage('🚀 Serveur de développement démarré avec succès!', 'success');
          logMessage(`🌐 URL d'accès: ${WORKTREE_COLOR}http://localhost:${port}${RESET_COLOR}`, 'success');
          logMessage(`📂 Worktree: ${WORKTREE_COLOR}${WORKTREE_NAME}${RESET_COLOR}`);
          logMessage(`🎨 Thème: ${WORKTREE_COLOR}Vert (#10B981)${RESET_COLOR}`);
          console.log('='.repeat(60));
          
          // Son de notification (bip console)
          console.log('\u0007'); // Bell character
          
          logMessage('Prêt à développer! 🎯');
        }
      }
    });
    
    // Capturer les erreurs
    nextProcess.stderr.on('data', (data) => {
      const output = data.toString();
      
      // Ne pas afficher certaines erreurs bénignes de Next.js
      if (!output.includes('ExperimentalWarning') && 
          !output.includes('punycode') &&
          !output.includes('--experimental-loader')) {
        process.stderr.write(output);
      }
    });
    
    // Gestion de l'arrêt propre
    process.on('SIGINT', () => {
      logMessage('Arrêt du serveur...', 'warning');
      nextProcess.kill('SIGINT');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      logMessage('Arrêt du serveur...', 'warning');
      nextProcess.kill('SIGTERM');
      process.exit(0);
    });
    
    // Gestion des erreurs du processus
    nextProcess.on('error', (error) => {
      logMessage(`Erreur lors du démarrage: ${error.message}`, 'error');
      process.exit(1);
    });
    
    nextProcess.on('exit', (code) => {
      if (code !== 0) {
        logMessage(`Le serveur s'est arrêté avec le code: ${code}`, 'error');
      } else {
        logMessage('Serveur arrêté proprement', 'success');
      }
    });
    
  } catch (error) {
    logMessage(`Erreur inattendue: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Vérifier les dépendances
if (!fs.existsSync('package.json')) {
  console.error('Erreur: package.json non trouvé. Êtes-vous dans le bon répertoire?');
  process.exit(1);
}

// Lancement
logMessage(`Initialisation du système de démarrage intelligent pour ${WORKTREE_NAME}...`);
startDevelopmentServer();