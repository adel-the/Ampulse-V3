const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Configuration du déploiement Vercel...\n');

// Vérification de l'installation de Vercel CLI
console.log('📦 Vérification de Vercel CLI...');
try {
  execSync('vercel --version', { stdio: 'pipe' });
  console.log('✅ Vercel CLI installé');
} catch (error) {
  console.log('❌ Vercel CLI non installé');
  console.log('📥 Installation de Vercel CLI...');
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('✅ Vercel CLI installé avec succès');
  } catch (installError) {
    console.log('❌ Erreur lors de l\'installation:', installError.message);
    console.log('💡 Installez manuellement: npm install -g vercel');
    process.exit(1);
  }
}

// Création du fichier vercel.json optimisé
console.log('\n📝 Création du fichier vercel.json...');
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
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
};

try {
  fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
  console.log('✅ vercel.json créé');
} catch (error) {
  console.log('❌ Erreur lors de la création de vercel.json:', error.message);
}

// Création du fichier .vercelignore
console.log('\n📝 Création du fichier .vercelignore...');
const vercelIgnore = `# Dépendances de développement
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Fichiers de build
.next
out
dist

# Fichiers de test
coverage
.nyc_output

# Fichiers de cache
.cache
.parcel-cache

# Fichiers de logs
*.log
logs

# Fichiers temporaires
.tmp
.temp

# Fichiers de configuration locale
.env.local
.env.development.local
.env.test.local
.env.production.local

# Fichiers de système
.DS_Store
Thumbs.db

# Fichiers de développement
*.tsbuildinfo
.vscode
.idea

# Scripts de développement
launch-dev.js
clean-windows.js
deploy-git.js
setup-vercel-deploy.js
diagnostic-final.js
simulate-vercel.js

# Documentation locale
RAPPORT_NETTOYAGE_FINAL.md

# Tests
tests/
*.spec.ts
*.test.ts

# Migrations (à gérer séparément)
supabase/migrations/
`;

try {
  fs.writeFileSync('.vercelignore', vercelIgnore);
  console.log('✅ .vercelignore créé');
} catch (error) {
  console.log('❌ Erreur lors de la création de .vercelignore:', error.message);
}

// Vérification de la configuration Git
console.log('\n🔍 Vérification de la configuration Git...');
try {
  const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
  console.log(`🌐 Repository: ${remoteUrl}`);
  
  if (remoteUrl.includes('github.com')) {
    console.log('✅ Repository GitHub détecté');
  } else if (remoteUrl.includes('gitlab.com')) {
    console.log('✅ Repository GitLab détecté');
  } else {
    console.log('⚠️ Repository non reconnu');
  }
} catch (error) {
  console.log('❌ Erreur lors de la vérification du repository:', error.message);
}

// Instructions pour le déploiement
console.log('\n📋 Instructions de déploiement Vercel:');
console.log('\n1️⃣ Déploiement manuel:');
console.log('   vercel --prod');
console.log('\n2️⃣ Déploiement avec variables d\'environnement:');
console.log('   vercel --prod --env NEXT_PUBLIC_SUPABASE_URL=your_url');
console.log('   vercel --prod --env NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
console.log('\n3️⃣ Configuration automatique:');
console.log('   - Connectez votre repository GitHub sur vercel.com');
console.log('   - Configurez les variables d\'environnement');
console.log('   - Activez le déploiement automatique');

// Création d'un script de déploiement rapide
console.log('\n📝 Création du script de déploiement rapide...');
const deployScript = `#!/bin/bash
echo "🚀 Déploiement rapide vers Vercel..."

# Vérification de l'état Git
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️ Modifications non commitées détectées"
    echo "📦 Ajout et commit des modifications..."
    git add .
    git commit -m "🚀 Déploiement automatique - $(date)"
    git push origin main
fi

# Déploiement Vercel
echo "📤 Déploiement vers Vercel..."
vercel --prod --yes

echo "✅ Déploiement terminé !"
`;

try {
  fs.writeFileSync('deploy-vercel.sh', deployScript);
  console.log('✅ Script deploy-vercel.sh créé');
} catch (error) {
  console.log('❌ Erreur lors de la création du script:', error.message);
}

// Création d'un fichier de configuration des variables d'environnement
console.log('\n📝 Création du fichier de configuration des variables...');
const envConfig = `# Configuration des variables d'environnement pour Vercel
# Copiez ce fichier vers .env.local pour le développement local

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Configuration de l'application
NEXT_PUBLIC_APP_NAME=SoliReserve Enhanced
NEXT_PUBLIC_APP_VERSION=0.1.0
NEXT_PUBLIC_APP_ENVIRONMENT=production

# Configuration des fonctionnalités
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_PDF_GENERATION=true

# Configuration de sécurité
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.vercel.app

# Configuration des performances
NEXT_PUBLIC_ENABLE_CACHE=true
NEXT_PUBLIC_CACHE_DURATION=3600
`;

try {
  fs.writeFileSync('env.example', envConfig);
  console.log('✅ Fichier env.example créé');
} catch (error) {
  console.log('❌ Erreur lors de la création du fichier env:', error.message);
}

console.log('\n🎉 Configuration Vercel terminée !');
console.log('📋 Fichiers créés:');
console.log('   - vercel.json (configuration Vercel)');
console.log('   - .vercelignore (fichiers ignorés)');
console.log('   - deploy-vercel.sh (script de déploiement)');
console.log('   - env.example (variables d\'environnement)');

console.log('\n🔗 Prochaines étapes:');
console.log('   1. Exécuter: vercel login');
console.log('   2. Configurer les variables d\'environnement');
console.log('   3. Exécuter: vercel --prod');
console.log('   4. Ou connecter le repository sur vercel.com');

console.log('\n📚 Documentation:');
console.log('   - https://vercel.com/docs');
console.log('   - https://vercel.com/docs/concepts/projects/environment-variables');
console.log('   - https://vercel.com/docs/concepts/git');

console.log('\n🚀 Votre application est prête pour le déploiement Vercel !');
