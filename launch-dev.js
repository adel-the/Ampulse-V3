const { execSync, spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 Lancement de l\'application en mode développement...\n');

// Vérification des ports
const checkPort = (port) => {
  try {
    execSync(`netstat -an | grep :${port}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
};

// Nettoyage des ports si nécessaire
const ports = [3000, 3001, 3002];
console.log('🔍 Vérification des ports...');
for (const port of ports) {
  if (checkPort(port)) {
    console.log(`⚠️ Port ${port} déjà utilisé`);
    try {
      execSync(`npx kill-port ${port}`, { stdio: 'pipe' });
      console.log(`✅ Port ${port} libéré`);
    } catch (error) {
      console.log(`❌ Impossible de libérer le port ${port}`);
    }
  } else {
    console.log(`✅ Port ${port} disponible`);
  }
}

// Nettoyage des caches
console.log('\n🧹 Nettoyage des caches...');
try {
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next', { stdio: 'inherit' });
    console.log('✅ Cache Next.js supprimé');
  }
} catch (error) {
  console.log('⚠️ Erreur lors du nettoyage:', error.message);
}

// Installation des dépendances si nécessaire
console.log('\n📦 Vérification des dépendances...');
if (!fs.existsSync('node_modules')) {
  console.log('Installation des dépendances...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dépendances installées');
  } catch (error) {
    console.log('❌ Erreur lors de l\'installation:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dépendances déjà installées');
}

// Lancement du serveur de développement
console.log('\n🌐 Lancement du serveur de développement...');
console.log('📍 URL: http://localhost:3000');
console.log('🔄 Redémarrage automatique activé');
console.log('📱 Mode responsive activé');
console.log('\n⏳ Démarrage en cours...\n');

try {
  const devServer = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  devServer.on('error', (error) => {
    console.error('❌ Erreur lors du lancement:', error);
    process.exit(1);
  });

  devServer.on('close', (code) => {
    console.log(`\n🛑 Serveur arrêté avec le code: ${code}`);
  });

  // Gestion de l'arrêt propre
  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur...');
    devServer.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Arrêt du serveur...');
    devServer.kill('SIGTERM');
    process.exit(0);
  });

} catch (error) {
  console.error('❌ Erreur lors du lancement du serveur:', error);
  process.exit(1);
}
