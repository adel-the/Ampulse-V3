# Script d'arrêt pour Ampulse V3 et Supabase Local
# Auteur: Claude Code Assistant
# Date: 26 Août 2025

Write-Host "🛑 Arrêt d'Ampulse V3 et Supabase Local..." -ForegroundColor Yellow

# Arrêt de Supabase
Write-Host "`n1️⃣ Arrêt de Supabase..." -ForegroundColor Yellow
try {
    supabase stop
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Supabase arrêté avec succès" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erreur lors de l'arrêt de Supabase" -ForegroundColor Red
    }
} catch {
    Write-Host "   ⚠️ Supabase CLI non trouvé ou déjà arrêté" -ForegroundColor Yellow
}

# Vérification des ports et processus Node.js
Write-Host "`n2️⃣ Nettoyage des processus Node.js..." -ForegroundColor Yellow

# Trouver et tuer les processus Node.js sur les ports utilisés
$ports = @(3000, 15421, 15432, 15433)

foreach ($port in $ports) {
    $processes = netstat -ano | findstr ":$port " | ForEach-Object {
        $fields = $_ -split '\s+'
        if ($fields.Count -ge 5) {
            return $fields[4]
        }
    } | Where-Object { $_ -match '^\d+$' } | Select-Object -Unique
    
    foreach ($pid in $processes) {
        try {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process -and $process.ProcessName -match "node|next|docker") {
                Write-Host "   🔄 Arrêt du processus $($process.ProcessName) (PID: $pid)" -ForegroundColor Gray
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        } catch {
            # Ignore les erreurs si le processus n'existe plus
        }
    }
}

Write-Host "   ✅ Nettoyage terminé" -ForegroundColor Green

# Affichage du statut
Write-Host "`n3️⃣ Vérification des ports..." -ForegroundColor Yellow

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

$stillUsed = @()
foreach ($port in $ports) {
    if (Test-Port $port) {
        $stillUsed += $port
    }
}

if ($stillUsed.Count -eq 0) {
    Write-Host "   ✅ Tous les ports sont libres" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Ports encore utilisés: $($stillUsed -join ', ')" -ForegroundColor Yellow
    Write-Host "   💡 Vous pouvez les libérer manuellement avec:" -ForegroundColor Cyan
    Write-Host "      netstat -ano | findstr :<PORT>" -ForegroundColor Gray
    Write-Host "      taskkill /PID <PID> /F" -ForegroundColor Gray
}

Write-Host "`n✅ Arrêt terminé!" -ForegroundColor Green
Write-Host "   Pour redémarrer, utilisez: .\start-local.ps1" -ForegroundColor Cyan

Read-Host "`nAppuyez sur Entrée pour fermer"