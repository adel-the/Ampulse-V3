# SoliReserve Enhanced - Application de Gestion Hôtelière

## 🎯 Vue d'ensemble

SoliReserve Enhanced est une application web moderne de gestion hôtelière développée avec Next.js 14, TypeScript, Tailwind CSS et Supabase. Elle permet la gestion complète des réservations, des chambres, des clients et des opérateurs sociaux.

## ✨ Fonctionnalités principales

### 🏨 Gestion des établissements
- Création et modification d'établissements
- Gestion des chambres et équipements
- Suivi des taux d'occupation
- Gestion des tarifs et conventions

### 📅 Réservations
- Création et modification de réservations
- Calendrier interactif
- Gestion des disponibilités
- Suivi des processus de réservation

### 👥 Gestion des clients
- Base de données clients complète
- Historique des interactions
- Segmentation des clients
- Gestion des contacts

### 🏢 Opérateurs sociaux
- Gestion des partenaires
- Conventions de prix
- Suivi des réservations
- Communication intégrée

### 💰 Comptabilité
- Facturation automatique
- Gestion des paiements
- Rapports financiers
- Export comptable

### ⚙️ Paramètres
- Gestion des utilisateurs et rôles
- Configuration des documents
- Personnalisation de l'interface
- Historique des modifications

## 🛠️ Technologies utilisées

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Base de données**: Supabase (PostgreSQL)
- **Authentification**: Supabase Auth
- **PDF**: jsPDF, html2canvas
- **Graphiques**: Recharts
- **Icônes**: Lucide React

## 📁 Structure du projet

```
ampulse v2/
├── app/                    # Pages Next.js App Router
│   ├── page.tsx           # Page principale
│   ├── layout.tsx         # Layout global
│   ├── error.tsx          # Gestion d'erreurs
│   └── ...                # Autres pages
├── components/            # Composants React
│   ├── ui/               # Composants UI de base
│   ├── features/         # Fonctionnalités métier
│   ├── pages/            # Pages spécifiques
│   ├── layout/           # Composants de mise en page
│   └── modals/           # Modales et popups
├── hooks/                # Hooks React personnalisés
├── lib/                  # Configuration et utilitaires
├── types/                # Définitions TypeScript
├── utils/                # Fonctions utilitaires
├── supabase/             # Configuration Supabase
└── public/               # Assets statiques
```

## 🚀 Installation et démarrage

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Compte Supabase

### Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd ampulse-v2
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration Supabase**
- Créer un projet Supabase
- Copier les variables d'environnement dans `.env.local`
- Exécuter les migrations SQL

4. **Lancer en développement**
```bash
npm run dev
```

5. **Accéder à l'application**
```
http://localhost:3000
```

## 📋 Scripts disponibles

### Développement
```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run start        # Serveur de production
npm run lint         # Vérification du code
```

### Utilitaires
```bash
node simulate-vercel.js      # Simulation déploiement Vercel
node launch-dev.js           # Lancement optimisé
node clean-windows.js        # Nettoyage Windows
node diagnostic-final.js     # Diagnostic complet
```

## 🔧 Configuration

### Variables d'environnement
Créer un fichier `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Base de données
Les migrations Supabase se trouvent dans `supabase/migrations/`. Exécutez-les dans l'ordre :

1. `001_initial_schema.sql`
2. `002_secure_updated_at_function.sql`
3. `003_add_processus_columns.sql`
4. `004_enhance_rooms_management.sql`
5. `006_price_convention_enhancement.sql`
6. `020_monthly_dynamic_pricing.sql`
7. `021_client_management_system.sql`
8. `022_update_clients_table.sql`
9. `023_add_client_functions.sql`
10. `024_add_test_clients.sql`
11. `025_add_search_clients_function.sql`
12. `026_fix_search_clients_function.sql`
13. `027_fix_search_clients_columns.sql`
14. `028_fix_timestamp_types.sql`
15. `029_add_generate_client_number.sql`
16. `030_fix_domaine_action_column.sql`
17. `031_fix_update_client_function.sql`
18. `032_simplify_update_client.sql`
19. `033_final_update_client.sql`

## 🎨 Interface utilisateur

L'application utilise un design moderne avec :
- Interface responsive
- Thème sombre/clair
- Composants accessibles
- Animations fluides
- Navigation intuitive

## 🔐 Sécurité

- Authentification Supabase
- Gestion des rôles et permissions
- Validation des données
- Protection CSRF
- Variables d'environnement sécurisées

## 📊 Performance

- Build optimisé Next.js
- Lazy loading des composants
- Images optimisées
- Code splitting automatique
- Cache intelligent

## 🧪 Tests

```bash
npm run test        # Tests unitaires
npm run test:e2e    # Tests end-to-end
```

## 📈 Déploiement

### Vercel (Recommandé)
1. Connecter le repository GitHub
2. Configurer les variables d'environnement
3. Déployer automatiquement

### Autres plateformes
- Netlify
- Railway
- DigitalOcean App Platform

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commiter les changements
4. Pousser vers la branche
5. Créer une Pull Request

## 📝 Changelog

### Version 0.1.0
- ✅ Application de base fonctionnelle
- ✅ Gestion des réservations
- ✅ Interface utilisateur moderne
- ✅ Intégration Supabase
- ✅ Système d'authentification
- ✅ Gestion des rôles

## 📞 Support

Pour toute question ou problème :
- Créer une issue GitHub
- Consulter la documentation Supabase
- Vérifier les logs de développement

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

**Développé avec ❤️ pour SoliReserve**
