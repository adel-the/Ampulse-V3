# Icônes Lucide utilisées dans EquipmentsSection

Cette liste documente toutes les icônes Lucide React utilisées dans le système de gestion des équipements.

## Icônes principales (déjà importées)

```typescript
import {
  // Icônes principales
  Plus, Edit2, Trash2, Filter, Building2, Link2,
  
  // Icônes de catégories
  Wifi, Tv, Coffee, Car, Home, Users, MapPin, 
  Wrench, Clock, Utensils, Bed, Bath, Wind, 
  Thermometer, Shield, Music, Baby, Gamepad2, 
  Dumbbell, Waves,
  
  // Icônes d'interface
  X, Tag, DollarSign, Settings, HelpCircle
} from 'lucide-react';
```

## Catégories d'équipements et leurs icônes

| Catégorie | Icône | Description |
|-----------|-------|-------------|
| Confort | `Home` | Équipements de confort général |
| Technologie | `Wifi` | WiFi, Internet, équipements tech |
| Salle de bain | `Bath` | Équipements sanitaires |
| Cuisine | `Utensils` | Équipements de cuisine |
| Climatisation | `Wind` | Chauffage, climatisation |
| Divertissement | `Tv` | TV, musique, jeux |
| Accessibilité | `Users` | Équipements PMR |
| Transport | `Car` | Parking, transport |
| Services | `Wrench` | Services d'entretien |
| Sécurité | `Shield` | Sécurité, coffres |
| Loisirs | `Gamepad2` | Jeux, activités |
| Bien-être | `Waves` | Spa, jacuzzi |
| Vue | `MapPin` | Types de vues |

## Icônes d'équipements spécifiques

| Équipement | Icône | Usage |
|------------|-------|--------|
| WiFi | `Wifi` | Connexion Internet |
| Télévision | `Tv` | TV, écrans |
| Café/Minibar | `Coffee` | Boissons, café |
| Parking | `Car` | Stationnement |
| Balcon/Terrasse | `Home` | Espaces extérieurs |
| PMR | `Users` | Accessibilité |
| Vue mer/jardin | `MapPin` ou `Waves` | Vues spéciales |
| Service | `Wrench` | Maintenance, service |
| Cuisine | `Utensils` | Kitchenette |
| Lit | `Bed` | Type de couchage |
| Bain | `Bath` | Salle de bain |
| Climatisation | `Wind` | Ventilation |
| Chauffage | `Thermometer` | Température |
| Sécurité | `Shield` | Coffre, sécurité |
| Musique | `Music` | Audio |
| Bébé | `Baby` | Équipements bébé |
| Jeux | `Gamepad2` | Divertissement |
| Sport | `Dumbbell` | Fitness |
| Jacuzzi | `Waves` | Bien-être |

## Icônes d'interface

| Action | Icône | Usage |
|--------|-------|--------|
| Ajouter | `Plus` | Créer nouvel équipement |
| Modifier | `Edit2` | Éditer équipement |
| Supprimer | `Trash2` | Supprimer équipement |
| Filtrer | `Filter` | Filtres de recherche |
| Hôtel | `Building2` | Sélection d'hôtel |
| Association | `Link2` | Lier équipement à hôtel |
| Fermer | `X` | Fermer modal |
| Catégorie | `Tag` | Catégorisation |
| Prix | `DollarSign` | Tarification |
| Paramètres | `Settings` | Configuration |
| Aide | `HelpCircle` | Information |

## Notes d'utilisation

- Toutes les icônes utilisent la taille `h-4 w-4` ou `h-5 w-5` pour la cohérence
- Les couleurs sont gérées via les classes Tailwind
- Les icônes sont typées avec `React.ComponentType<any>` pour la flexibilité
- Chaque équipement peut avoir une icône personnalisée sélectionnable via le modal