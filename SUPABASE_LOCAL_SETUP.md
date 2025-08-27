# Guide de Configuration Supabase Local

Ce guide vous aidera à configurer et lancer Supabase en local pour le projet Ampulse V3.

## Prérequis

1. **Docker Desktop** doit être installé et en cours d'exécution
   - Télécharger depuis : https://www.docker.com/products/docker-desktop/
   - Assurez-vous que Docker est démarré avant de continuer

2. **Supabase CLI** doit être installé
   ```bash
   npm install -g supabase
   ```

## Configuration des Ports (Important pour Windows)

Le projet utilise des ports personnalisés pour éviter les conflits sur Windows :
- **API** : Port 15421 (au lieu de 54321)
- **Database** : Port 15432 (au lieu de 54322)
- **Studio** : Port 15433 (au lieu de 54323)

Ces ports sont configurés dans `supabase/config.toml`.

## Étapes pour Lancer Supabase Local

### 1. Arrêter toute instance existante

```bash
# Arrêter Supabase s'il est déjà en cours d'exécution
supabase stop
```

### 2. Démarrer Supabase avec la configuration personnalisée

```bash
# Se placer dans le répertoire du projet
cd "D:\Dev\Ampulse v3"

# Démarrer Supabase
supabase start
```

### 3. Vérifier que Supabase est bien lancé

Après le démarrage, vous devriez voir :

```
Started supabase local development setup.

         API URL: http://127.0.0.1:15421
          DB URL: postgresql://postgres:postgres@127.0.0.1:15432/postgres
      Studio URL: http://127.0.0.1:15433
    Inbucket URL: http://127.0.0.1:15424
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
        service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Configuration du fichier .env.local

Créez ou mettez à jour le fichier `.env.local` à la racine du projet :

```env
# URL de l'API Supabase (port personnalisé)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:15421

# Clé publique (anon key) - pour les opérations côté client
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Clé service role - pour les opérations administratives (bypass RLS)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

## Lancer l'Application

### 1. Installer les dépendances

```bash
npm install
```

### 2. Démarrer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur : http://localhost:3000

## Accès à Supabase Studio

Pour gérer votre base de données visuellement :
1. Ouvrir : http://127.0.0.1:15433
2. Aucune authentification n'est requise en local

## Scripts Utiles

### Script PowerShell de démarrage rapide

Créez un fichier `start-local.ps1` :

```powershell
# Démarrer Docker s'il n'est pas lancé
$docker = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Host "Démarrage de Docker Desktop..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Start-Sleep -Seconds 20
}

# Arrêter Supabase existant
Write-Host "Arrêt de Supabase..." -ForegroundColor Yellow
supabase stop

# Démarrer Supabase
Write-Host "Démarrage de Supabase..." -ForegroundColor Green
supabase start

# Afficher les URLs
Write-Host "`n✅ Supabase est prêt!" -ForegroundColor Green
Write-Host "API: http://127.0.0.1:15421" -ForegroundColor Cyan
Write-Host "Studio: http://127.0.0.1:15433" -ForegroundColor Cyan
Write-Host "Database: postgresql://postgres:postgres@127.0.0.1:15432/postgres" -ForegroundColor Cyan

# Démarrer l'application Next.js
Write-Host "`nDémarrage de l'application..." -ForegroundColor Green
npm run dev
```

Exécutez avec : `.\start-local.ps1`

## Dépannage

### Erreur : "Port already in use"

Si vous obtenez une erreur de port déjà utilisé :

1. **Windows** - Libérer les ports :
```powershell
# Trouver le processus utilisant le port
netstat -ano | findstr :15421
netstat -ano | findstr :15432
netstat -ano | findstr :15433

# Tuer le processus (remplacer PID par l'ID du processus)
taskkill /PID <PID> /F
```

2. **Alternative** - Utiliser des ports différents :
   - Modifier `supabase/config.toml`
   - Mettre à jour `.env.local` avec les nouveaux ports

### Erreur : "401 Unauthorized"

Cette erreur indique un problème d'authentification :

1. Vérifiez que `.env.local` contient les bonnes clés
2. Assurez-vous que l'application utilise `supabaseAdmin` pour les opérations administratives
3. Redémarrez le serveur Next.js après avoir modifié `.env.local`

### Erreur : "Docker is not running"

1. Démarrez Docker Desktop
2. Attendez que Docker soit complètement démarré (icône verte dans la barre système)
3. Réessayez `supabase start`

### Réinitialiser Supabase

Pour repartir de zéro :

```bash
# Arrêter et supprimer tous les conteneurs
supabase stop --backup false

# Redémarrer avec une base propre
supabase start

# Appliquer les migrations
supabase db reset
```

## Architecture du Projet

Le projet utilise deux clients Supabase :

1. **`supabase`** (client standard) :
   - Utilise la clé `anon`
   - Pour les opérations côté client
   - Respecte les politiques RLS

2. **`supabaseAdmin`** (client administrateur) :
   - Utilise la clé `service_role`
   - Pour les opérations serveur
   - Bypass les politiques RLS
   - Utilisé dans les fichiers API (`lib/api/`)

## Commandes Supabase CLI Utiles

```bash
# Statut des services
supabase status

# Voir les logs
supabase db logs

# Réinitialiser la base de données
supabase db reset

# Créer une nouvelle migration
supabase migration new <nom_migration>

# Appliquer les migrations
supabase db push

# Générer les types TypeScript
supabase gen types typescript --local > types/supabase.ts
```

## Support et Ressources

- **Documentation Supabase** : https://supabase.com/docs
- **CLI Supabase** : https://supabase.com/docs/guides/cli
- **Issues du projet** : https://github.com/adel-the/Ampulse-V3/issues

## Notes Importantes

1. **Ne jamais commiter** le fichier `.env.local` dans git
2. **Service Role Key** : Cette clé donne un accès complet à la base de données. Ne l'utilisez que côté serveur, jamais côté client
3. **Ports personnalisés** : Les ports 154xx sont utilisés pour éviter les conflits avec d'autres services Windows
4. **Docker obligatoire** : Supabase local nécessite Docker pour fonctionner

---

*Dernière mise à jour : 26 Août 2025*