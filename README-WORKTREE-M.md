# Worktree M - Système de Démarrage Intelligent

## Vue d'ensemble

Ce worktree est dédié aux fonctionnalités de **Maintenance** avec un système de démarrage intelligent qui détecte automatiquement l'environnement et configure le serveur de développement optimalement.

## Démarrage Rapide

```bash
# Méthode recommandée - Script intelligent
npm run dev:m

# Méthode alternative - Port fixe
npm run start:m
```

## Fonctionnalités du Système de Démarrage

### 🎯 Détection Automatique
- Détecte automatiquement qu'on est dans le worktree M
- Vérifie la disponibilité des ports (3010-3015)
- Sélectionne automatiquement le premier port libre

### 🎨 Interface Améliorée
- Messages colorés avec thème vert (#10B981)
- Affichage clair de l'URL d'accès
- Horodatage des événements
- Son de notification quand le serveur est prêt

### 🔧 Configuration Intelligente
- Port par défaut : **3010**
- Ports autorisés : **3010-3015**
- Gestion des erreurs robuste
- Arrêt propre avec Ctrl+C

## Fichiers de Configuration

### `start-dev.js`
Script principal qui :
- Vérifie l'environnement worktree
- Détecte les ports libres
- Lance Next.js avec la configuration optimale
- Affiche des messages informatifs stylisés

### `worktree-config.json`
Configuration centralisée pour :
- Thème et couleurs spécifiques au worktree M
- Métadonnées du projet
- Intégrations Supabase
- Paramètres de développement

### `package.json`
Scripts ajoutés :
- `dev:m` : Lance le script intelligent
- `start:m` : Démarre sur le port 3010 fixe

## Utilisation

### Démarrage Standard
```bash
cd M
npm run dev:m
```

### Messages Typiques
```
[M] 17:27:03 Initialisation du système de démarrage intelligent pour M...
[M] 17:27:03 Démarrage du serveur de développement pour le worktree M...
[M] 17:27:03 Vérification du port 3010... OK
============================================================
[M] 17:27:06 ✓ 🚀 Serveur de développement démarré avec succès!
[M] 17:27:06 ✓ 🌐 URL d'accès: http://localhost:3010
[M] 17:27:06 📂 Worktree: M
[M] 17:27:06 🎨 Thème: Vert (#10B981)
============================================================
[M] 17:27:06 Prêt à développer! 🎯
```

## Gestion des Ports

Le système vérifie automatiquement les ports dans l'ordre :
1. **3010** (préféré)
2. **3011**
3. **3012**
4. **3013**
5. **3014**
6. **3015**

Si aucun port n'est libre, le script s'arrête avec un message d'erreur.

## Arrêt

Utiliser `Ctrl+C` pour arrêter proprement le serveur. Le script gère automatiquement la fermeture des processus.

## Dépannage

### Port déjà utilisé
```
[M] 17:27:03 ⚠ Port 3010 occupé, utilisation du port 3011
```
→ Normal, le script utilise automatiquement le port suivant

### Erreur de démarrage
```
[M] 17:27:03 ✗ Erreur: Ce script doit être exécuté depuis le worktree M
```
→ Vérifiez que vous êtes dans le bon répertoire (`D:\Dev\Ampulse v3\M`)

### Aucun port disponible
```
[M] 17:27:03 ✗ Erreur: Aucun port disponible dans la plage 3010-3015
```
→ Arrêtez d'autres serveurs de développement ou redémarrez votre machine

---

**Worktree M** - Maintenance & Équipements | Thème: Vert #10B981