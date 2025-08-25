const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Nettoyage de l\'application pour Windows...\n');

// Fonction pour supprimer un dossier de manière sécurisée
const removeDirectory = (dirPath) => {
  if (fs.existsSync(dirPath)) {
    try {
      execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'pipe' });
      console.log(`✅ ${dirPath} supprimé`);
    } catch (error) {
      console.log(`⚠️ Erreur lors de la suppression de ${dirPath}:`, error.message);
    }
  } else {
    console.log(`ℹ️ ${dirPath} n'existe pas`);
  }
};

// Fonction pour supprimer un fichier de manière sécurisée
const removeFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    try {
      execSync(`del /f /q "${filePath}"`, { stdio: 'pipe' });
      console.log(`✅ ${filePath} supprimé`);
    } catch (error) {
      console.log(`⚠️ Erreur lors de la suppression de ${filePath}:`, error.message);
    }
  } else {
    console.log(`ℹ️ ${filePath} n'existe pas`);
  }
};

// Nettoyage des caches Next.js
console.log('📁 Nettoyage des caches...');
removeDirectory('.next');
removeDirectory('node_modules/.cache');

// Nettoyage des fichiers temporaires
console.log('\n🗑️ Nettoyage des fichiers temporaires...');
removeFile('npm-debug.log');
removeFile('yarn-debug.log');
removeFile('yarn-error.log');

// Nettoyage des fichiers de build
console.log('\n🏗️ Nettoyage des fichiers de build...');
removeDirectory('out');
removeDirectory('dist');

// Nettoyage des fichiers de test
console.log('\n🧪 Nettoyage des fichiers de test...');
removeDirectory('coverage');
removeFile('.nyc_output');

// Nettoyage des fichiers de logs
console.log('\n📝 Nettoyage des logs...');
const logFiles = [
  '*.log',
  'logs/*.log',
  '*.pid',
  '*.seed',
  '*.pid.lock'
];

logFiles.forEach(pattern => {
  try {
    execSync(`del /f /q "${pattern}"`, { stdio: 'pipe' });
  } catch (error) {
    // Ignore les erreurs si les fichiers n'existent pas
  }
});

// Nettoyage du cache npm
console.log('\n📦 Nettoyage du cache npm...');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('✅ Cache npm nettoyé');
} catch (error) {
  console.log('⚠️ Erreur lors du nettoyage du cache npm:', error.message);
}

// Vérification de l'espace disque libéré
console.log('\n💾 Vérification de l\'espace disque...');
try {
  const diskSpace = execSync('wmic logicaldisk get size,freespace,caption', { encoding: 'utf8' });
  console.log('📊 Espace disque disponible:');
  console.log(diskSpace);
} catch (error) {
  console.log('⚠️ Impossible de vérifier l\'espace disque:', error.message);
}

console.log('\n🎉 Nettoyage terminé !');
console.log('📋 Actions effectuées:');
console.log('   - Cache Next.js supprimé');
console.log('   - Fichiers temporaires supprimés');
console.log('   - Fichiers de build supprimés');
console.log('   - Fichiers de test supprimés');
console.log('   - Logs nettoyés');
console.log('   - Cache npm nettoyé');
console.log('\n🚀 L\'application est prête pour un nouveau build !');
