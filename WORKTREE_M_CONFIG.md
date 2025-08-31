# WORKTREE M - CONFIGURATION ET DOCUMENTATION

## Vue d'ensemble

Ce document décrit la configuration et l'utilisation du **worktree M (Maintenance)** pour le projet Ampulse v3. Le worktree M est dédié aux fonctionnalités de maintenance système et de gestion administrative.

## Identification du Worktree

- **Nom**: M (Maintenance)
- **Port**: 3010
- **Couleur**: #10B981 (Emerald-500)
- **Description**: Maintenance and System Management
- **Branche**: Basée sur master avec fonctionnalités de maintenance

## Configuration de l'Environnement

### 1. Fichier de Configuration

Le worktree M utilise `.env.local.example` comme template :

```bash
# Copiez le template
cp .env.local.example .env.local

# Éditez avec vos credentials Supabase
nano .env.local
```

### 2. Variables d'Environnement Spécifiques

```env
# Configuration worktree
PORT=3010
WORKTREE_NAME=M
WORKTREE_COLOR=#10B981

# Fonctionnalités maintenance
NEXT_PUBLIC_ENABLE_MAINTENANCE_MODE=true
NEXT_PUBLIC_ENABLE_SYSTEM_DIAGNOSTICS=true
NEXT_PUBLIC_ENABLE_DATABASE_TOOLS=true
```

## Démarrage du Serveur

### Commandes de Base

```bash
# Démarrer le serveur de développement (port 3010)
npm run dev

# Ou spécifier explicitement le port
npm run dev -- --port 3010

# Build pour production
npm run build

# Démarrer en mode production
npm start
```

### Vérification du Port

Le serveur sera accessible sur :
- **URL de développement**: http://localhost:3010
- **Environnement**: Worktree M (Maintenance)

## Gestion des Ports

### Allocation des Ports par Worktree

| Worktree | Port | Usage | Couleur |
|----------|------|-------|---------|
| M (Maintenance) | 3010 | Maintenance système | #10B981 |
| F (Features) | 3011 | Nouvelles fonctionnalités | #3B82F6 |
| I (Integration) | 3012 | Tests d'intégration | #F59E0B |
| Réservé | 3013 | Développement futur | - |
| Réservé | 3014 | Tests E2E | - |
| Réservé | 3015 | Staging | - |

### Commandes Spécifiques par Port

```bash
# Worktree M (Maintenance)
npm run dev -- --port 3010

# Worktree F (Features) 
npm run dev -- --port 3011

# Worktree I (Integration)
npm run dev -- --port 3012
```

## Réplication vers F et I

### 1. Créer le Worktree F

```bash
# Depuis le répertoire racine
git worktree add F master

# Copier les fichiers de configuration
cp M/.env.local.example F/
cp M/WORKTREE_M_CONFIG.md F/WORKTREE_F_CONFIG.md
cp -r M/scripts F/

# Modifier la configuration pour F
cd F
sed -i 's/PORT=3010/PORT=3011/g' .env.local.example
sed -i 's/WORKTREE_NAME=M/WORKTREE_NAME=F/g' .env.local.example
sed -i 's/WORKTREE_COLOR=#10B981/WORKTREE_COLOR=#3B82F6/g' .env.local.example
sed -i 's/Maintenance/Features/g' .env.local.example
```

### 2. Créer le Worktree I

```bash
# Depuis le répertoire racine
git worktree add I master

# Copier les fichiers de configuration
cp M/.env.local.example I/
cp M/WORKTREE_M_CONFIG.md I/WORKTREE_I_CONFIG.md
cp -r M/scripts I/

# Modifier la configuration pour I
cd I
sed -i 's/PORT=3010/PORT=3012/g' .env.local.example
sed -i 's/WORKTREE_NAME=M/WORKTREE_NAME=I/g' .env.local.example
sed -i 's/WORKTREE_COLOR=#10B981/WORKTREE_COLOR=#F59E0B/g' .env.local.example
sed -i 's/Maintenance/Integration/g' .env.local.example
```

### 3. Script de Réplication Automatique

```bash
# Créer tous les worktrees d'un coup
./scripts/create-all-worktrees.sh
```

## Tests et Validation

### Tests Spécifiques au Worktree M

```bash
# Tests de maintenance
npm run test:maintenance

# Validation des outils système
npm run validate:system

# Tests de base de données
npm run test:database:integrity
```

### Commandes de Diagnostic

```bash
# Vérifier la configuration du worktree
node scripts/check-worktree.js

# Diagnostic complet
npm run diagnostic:full

# Vérifier les permissions
npm run check:permissions
```

## Fonctionnalités Spécifiques

### 1. Mode Maintenance

- Interface de gestion des tâches de maintenance
- Outils de diagnostic système
- Gestion des sauvegardes
- Monitoring des performances

### 2. Outils Base de Données

- Interface d'administration Supabase
- Outils de migration
- Validation de l'intégrité
- Nettoyage automatique

### 3. Gestion des Utilisateurs

- Interface d'administration des utilisateurs
- Gestion des rôles et permissions
- Audit des activités
- Outils de sécurité

## Troubleshooting

### Problèmes Courants

#### 1. Port Occupé

```bash
# Vérifier quel processus utilise le port 3010
netstat -ano | findstr :3010

# Tuer le processus si nécessaire
taskkill /PID [PID_NUMBER] /F

# Ou utiliser un port alternatif
npm run dev -- --port 3013
```

#### 2. Variables d'Environnement

```bash
# Vérifier que .env.local existe
ls -la .env.local

# Vérifier le contenu
cat .env.local | grep -E "(PORT|WORKTREE|SUPABASE)"

# Recopier le template si nécessaire
cp .env.local.example .env.local
```

#### 3. Problèmes de Worktree

```bash
# Vérifier le statut du worktree
git worktree list

# Réparer si nécessaire
git worktree repair

# Vérifier qu'on est dans le bon worktree
pwd
git branch --show-current
```

#### 4. Problèmes Supabase

```bash
# Tester la connexion Supabase
node scripts/test-supabase-connection.js

# Vérifier les credentials
node scripts/validate-env.js

# Reset de la configuration
npm run supabase:reset-config
```

### Messages d'Erreur Fréquents

#### "Port 3010 already in use"
- Solution: Changer de port ou tuer le processus existant
- Commande: `npm run dev -- --port 3013`

#### "Worktree not found"
- Solution: Vérifier qu'on est dans le bon répertoire
- Commande: `node scripts/check-worktree.js`

#### "Supabase connection failed"
- Solution: Vérifier les variables d'environnement
- Fichier: `.env.local`

#### "Cannot commit to master"
- Solution: C'est normal, le script de protection fonctionne
- Action: Créer une branche de feature

## Scripts de Protection

### Vérifications Automatiques

Le script `scripts/check-worktree.js` effectue :
- Vérification du worktree courant
- Protection contre les commits sur master
- Validation de la configuration
- Affichage des warnings appropriés

### Commandes de Vérification

```bash
# Vérification complète
node scripts/check-worktree.js

# Vérification rapide
npm run check:worktree

# Validation de l'environnement
npm run validate:env
```

## Bonnes Pratiques

### 1. Développement

- Toujours vérifier le worktree avant de commencer
- Utiliser le port assigné (3010 pour M)
- Créer des branches de feature depuis le worktree
- Ne jamais committer directement sur master

### 2. Configuration

- Copier `.env.local.example` vers `.env.local`
- Ne jamais committer `.env.local`
- Maintenir les variables spécifiques au worktree
- Documenter les changements de configuration

### 3. Tests

- Exécuter les tests avant les commits
- Valider la configuration régulièrement
- Tester sur le port approprié
- Vérifier les fonctionnalités spécifiques au worktree

## Support et Contact

Pour toute question ou problème :

1. Consulter ce document en premier
2. Vérifier les logs avec `npm run dev`
3. Utiliser les scripts de diagnostic
4. Consulter la documentation principale dans `CLAUDE.md`

---

**Dernière mise à jour**: 31 août 2025
**Version**: 1.0.0
**Worktree**: M (Maintenance)