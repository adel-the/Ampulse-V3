const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Déploiement Vercel - SoliReserve Enhanced');
console.log('============================================\n');

// Fonction pour exécuter une commande avec gestion d'erreur
function runCommand(command, description) {
  try {
    console.log(`📋 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} - Réussi\n`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} - Échec: ${error.message}\n`);
    return false;
  }
}

// Fonction pour vérifier si un fichier existe
function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description} - Présent`);
    return true;
  } else {
    console.log(`❌ ${description} - Manquant`);
    return false;
  }
}

// Vérification de la structure du projet
console.log('🔍 Vérification de la structure du projet...');
const requiredFiles = [
  { path: 'package.json', desc: 'package.json' },
  { path: 'next.config.js', desc: 'next.config.js' },
  { path: 'app/page.tsx', desc: 'Page d\'accueil' },
  { path: 'app/layout.tsx', desc: 'Layout principal' },
  { path: 'tsconfig.json', desc: 'Configuration TypeScript' },
  { path: 'tailwind.config.js', desc: 'Configuration Tailwind' }
];

let allFilesPresent = true;
requiredFiles.forEach(file => {
  if (!checkFile(file.path, file.desc)) {
    allFilesPresent = false;
  }
});

if (!allFilesPresent) {
  console.log('\n❌ Structure du projet incomplète. Arrêt du déploiement.');
  process.exit(1);
}

console.log('\n✅ Structure du projet validée\n');

// Nettoyage des caches
console.log('🧹 Nettoyage des caches...');
try {
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
    console.log('✅ Cache .next supprimé');
  }
  if (fs.existsSync('node_modules/.cache')) {
    fs.rmSync('node_modules/.cache', { recursive: true, force: true });
    console.log('✅ Cache node_modules supprimé');
  }
} catch (error) {
  console.log(`⚠️ Erreur lors du nettoyage: ${error.message}`);
}
console.log('');

// Installation des dépendances
if (!runCommand('npm install', 'Installation des dépendances')) {
  process.exit(1);
}

// Vérification TypeScript
if (!runCommand('npx tsc --noEmit', 'Vérification TypeScript')) {
  console.log('⚠️ Erreurs TypeScript détectées, mais continuation...\n');
}

// Build de production
if (!runCommand('npm run build', 'Build de production')) {
  process.exit(1);
}

// Vérification de Vercel CLI
console.log('🔍 Vérification de Vercel CLI...');
try {
  execSync('vercel --version', { stdio: 'pipe' });
  console.log('✅ Vercel CLI installé\n');
} catch (error) {
  console.log('❌ Vercel CLI non installé. Installation...');
  if (!runCommand('npm install -g vercel', 'Installation Vercel CLI')) {
    console.log('❌ Impossible d\'installer Vercel CLI. Veuillez l\'installer manuellement.');
    process.exit(1);
  }
}

// Création du fichier vercel.json s'il n'existe pas
if (!fs.existsSync('vercel.json')) {
  console.log('📝 Création du fichier vercel.json...');
  const vercelConfig = {
    "version": 2,
    "builds": [
      {
        "src": "package.json",
        "use": "@vercel/next"
      }
    ],
    "routes": [
      {
        "src": "/(.*)",
        "dest": "/"
      }
    ],
    "env": {
      "NODE_ENV": "production"
    }
  };
  
  fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
  console.log('✅ vercel.json créé\n');
}

// Création du fichier .vercelignore s'il n'existe pas
if (!fs.existsSync('.vercelignore')) {
  console.log('📝 Création du fichier .vercelignore...');
  const vercelIgnore = `# Dépendances de développement
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Fichiers de build
.next
out

# Fichiers de cache
.cache
.parcel-cache

# Fichiers d'environnement
.env.local
.env.development.local
.env.test.local
.env.production.local

# Fichiers de logs
*.log

# Fichiers temporaires
.tmp
.temp

# Fichiers de test
coverage
.nyc_output

# Fichiers de documentation
*.md
!README.md

# Fichiers de configuration
.eslintrc*
.prettierrc*
.editorconfig

# Fichiers de système
.DS_Store
Thumbs.db
`;
  
  fs.writeFileSync('.vercelignore', vercelIgnore);
  console.log('✅ .vercelignore créé\n');
}

// Déploiement Vercel
console.log('🚀 Déploiement sur Vercel...');
console.log('⚠️ Note: Vous devrez vous connecter à Vercel si ce n\'est pas déjà fait.\n');

const deployCommand = process.argv.includes('--prod') ? 'vercel --prod' : 'vercel';

if (runCommand(deployCommand, 'Déploiement Vercel')) {
  console.log('🎉 Déploiement Vercel réussi !');
  console.log('\n📋 Prochaines étapes:');
  console.log('1. Vérifier l\'URL de déploiement fournie');
  console.log('2. Configurer les variables d\'environnement sur Vercel');
  console.log('3. Tester l\'application en production');
  console.log('4. Configurer un domaine personnalisé si nécessaire');
} else {
  console.log('❌ Échec du déploiement Vercel');
  console.log('\n🔧 Solutions possibles:');
  console.log('1. Vérifier votre connexion internet');
  console.log('2. Vérifier vos identifiants Vercel');
  console.log('3. Vérifier les variables d\'environnement');
  console.log('4. Consulter les logs de déploiement');
}

console.log('\n📚 Documentation:');
console.log('- Vercel CLI: https://vercel.com/docs/cli');
console.log('- Next.js sur Vercel: https://vercel.com/docs/functions/serverless-functions/runtimes/nodejs');
console.log('- Variables d\'environnement: https://vercel.com/docs/projects/environment-variables');

console.log('\n🚀 Déploiement Vercel terminé !');
