# Script de démarrage automatique pour Ampulse V3 avec Supabase Local
# Auteur: Claude Code Assistant
# Date: 26 Août 2025

Write-Host "🚀 Démarrage d'Ampulse V3 avec Supabase Local..." -ForegroundColor Cyan

# Fonction pour vérifier si un port est utilisé
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("127.0.0.1", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Vérifier si Docker est en cours d'exécution
Write-Host "1️⃣ Vérification de Docker Desktop..." -ForegroundColor Yellow
$dockerProcess = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
if (-not $dockerProcess) {
    Write-Host "   ⚠️ Docker Desktop n'est pas démarré. Tentative de démarrage..." -ForegroundColor Yellow
    
    # Chemin typique de Docker Desktop
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process $dockerPath
        Write-Host "   ⏳ Attente du démarrage de Docker (30 secondes)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
    } else {
        Write-Host "   ❌ Docker Desktop introuvable. Veuillez le démarrer manuellement." -ForegroundColor Red
        Write-Host "   💡 Téléchargez Docker Desktop depuis: https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
        Read-Host "   Appuyez sur Entrée une fois Docker démarré"
    }
} else {
    Write-Host "   ✅ Docker Desktop est en cours d'exécution" -ForegroundColor Green
}

# Vérifier les ports utilisés
Write-Host "`n2️⃣ Vérification des ports..." -ForegroundColor Yellow
$ports = @(15421, 15432, 15433)
$portsInUse = @()

foreach ($port in $ports) {
    if (Test-Port $port) {
        $portsInUse += $port
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host "   ⚠️ Ports déjà utilisés: $($portsInUse -join ', ')" -ForegroundColor Yellow
    $response = Read-Host "   Voulez-vous arrêter les services utilisant ces ports? (O/N)"
    
    if ($response -eq "O" -or $response -eq "o") {
        Write-Host "   🛑 Arrêt de Supabase existant..." -ForegroundColor Yellow
        supabase stop
        Start-Sleep -Seconds 5
    }
} else {
    Write-Host "   ✅ Tous les ports sont libres" -ForegroundColor Green
}

# Démarrer Supabase
Write-Host "`n3️⃣ Démarrage de Supabase..." -ForegroundColor Yellow
try {
    $supabaseOutput = supabase start 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Supabase démarré avec succès!" -ForegroundColor Green
        
        # Extraire les informations importantes
        Write-Host "`n📊 Informations de connexion:" -ForegroundColor Cyan
        Write-Host "   🌐 API URL:    http://127.0.0.1:15421" -ForegroundColor White
        Write-Host "   🎨 Studio URL: http://127.0.0.1:15433" -ForegroundColor White
        Write-Host "   🗄️ DB URL:     postgresql://postgres:postgres@127.0.0.1:15432/postgres" -ForegroundColor White
        
    } else {
        Write-Host "   ❌ Erreur lors du démarrage de Supabase" -ForegroundColor Red
        Write-Host $supabaseOutput
        Read-Host "   Appuyez sur Entrée pour continuer quand même"
    }
} catch {
    Write-Host "   ❌ Supabase CLI non trouvé ou erreur" -ForegroundColor Red
    Write-Host "   💡 Installez Supabase CLI avec: npm install -g supabase" -ForegroundColor Cyan
    Read-Host "   Appuyez sur Entrée pour continuer quand même"
}

# Vérifier le fichier .env.local
Write-Host "`n4️⃣ Vérification de la configuration..." -ForegroundColor Yellow
$envFile = ".env.local"

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    
    if ($envContent -match "127\.0\.0\.1:15421") {
        Write-Host "   ✅ Fichier .env.local correctement configuré" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Le fichier .env.local pourrait nécessiter une mise à jour" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Fichier .env.local manquant" -ForegroundColor Red
    Write-Host "   💡 Consultez SUPABASE_LOCAL_SETUP.md pour la configuration" -ForegroundColor Cyan
}

# Installer les dépendances si nécessaire
Write-Host "`n5️⃣ Vérification des dépendances..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "   📦 Installation des dépendances npm..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Dépendances installées" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erreur lors de l'installation des dépendances" -ForegroundColor Red
    }
} else {
    Write-Host "   ✅ Dépendances déjà installées" -ForegroundColor Green
}

# Démarrer l'application Next.js
Write-Host "`n6️⃣ Démarrage de l'application Next.js..." -ForegroundColor Yellow
Write-Host "   🌐 L'application sera accessible sur: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   🎨 Supabase Studio disponible sur: http://127.0.0.1:15433" -ForegroundColor Cyan
Write-Host ""
Write-Host "   💡 Pour arrêter:" -ForegroundColor Gray
Write-Host "      - Ctrl+C pour arrêter Next.js" -ForegroundColor Gray
Write-Host "      - 'supabase stop' pour arrêter Supabase" -ForegroundColor Gray
Write-Host ""

# Lancer npm run dev
npm run dev