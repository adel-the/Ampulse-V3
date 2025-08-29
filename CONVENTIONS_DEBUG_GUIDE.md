# Guide de Débogage - Affichage des Conventions Tarifaires

## Problème
Les conventions de prix enregistrées dans la base de données ne s'affichent pas lorsqu'on visualise ou modifie un client.

## Solution Appliquée

### 1. ✅ Ajout de Logs de Débogage
Des logs ont été ajoutés pour tracer le flux de données :

**Dans la console du navigateur (F12), vous verrez :**

```javascript
// 1. Dans NewPrescripteurPage
[NewPrescripteurPage] Loading conventions for client ID: 31
[NewPrescripteurPage] API result: {success: true, data: [...]}
[NewPrescripteurPage] Conventions tarifaires chargées: [...]
[NewPrescripteurPage] Données transformées pour ConventionPrix: [...]

// 2. Dans l'API
[API conventions] Found 2 conventions for client 31
[API conventions] First convention sample: {...}

// 3. Dans le composant ConventionPrix
[ConventionPrix] useEffect triggered
[ConventionPrix] roomCategories: [...]
[ConventionPrix] initialData: [...]
[ConventionPrix] Setting pricing data from initialData: [...]
```

### 2. ✅ Transformation des Données
La fonction `transformConventionData` transforme les données de la BD vers le format du composant :

**Format Base de Données :**
```javascript
{
  category_id: 2,
  prix_defaut: 100,
  prix_janvier: 90,
  prix_juillet: 130,
  // ... autres prix mensuels
  conditions: "Convention spéciale"
}
```

**Format Composant :**
```javascript
{
  categoryId: "2",
  categoryName: "F1 (T2)",
  defaultPrice: 100,
  monthlyPrices: {
    janvier: 90,
    juillet: 130
  },
  conditions: "Convention spéciale"
}
```

## Test de Vérification

### 1. Vérifier les Données dans la Base
Exécutez ce script pour voir les conventions existantes :
```bash
node scripts/test-conventions-display.js
```

### 2. Vérifier dans le Navigateur
1. Ouvrez la console (F12)
2. Allez sur la page d'édition d'un client
3. Regardez les logs qui commencent par `[NewPrescripteurPage]`, `[API conventions]` et `[ConventionPrix]`

### 3. Points de Vérification

✅ **Si vous voyez les données dans les logs mais pas dans l'interface :**
- Le composant ConventionPrix pourrait avoir un problème de rendu
- Vérifiez que les catégories de chambres sont bien chargées

✅ **Si vous ne voyez pas de données dans les logs :**
- Les conventions n'existent pas pour ce client
- Problème de connexion à la base de données

✅ **Si les données sont transformées mais pas affichées :**
- Problème de timing (les données arrivent après le rendu)
- Le composant n'est pas mis à jour quand les données changent

## Flux de Données Complet

```
1. Page charge le client (NewPrescripteurPage)
   ↓
2. API récupère les conventions (conventionsApi.getClientConventions)
   ↓
3. Transformation des données (transformConventionData)
   ↓
4. État mis à jour (setConventionPricingData)
   ↓
5. Composant reçoit les données (ConventionPrix prop: initialData)
   ↓
6. Affichage des prix dans les champs
```

## Solutions Possibles

### Si les conventions ne s'affichent toujours pas :

1. **Rafraîchir la page** avec Ctrl+F5
2. **Vérifier que le client a des conventions** :
   - Dans la console, regardez si `[API conventions] Found X conventions` montre un nombre > 0
3. **Créer une nouvelle convention de test** pour vérifier que la sauvegarde fonctionne
4. **Vérifier les catégories de chambres** sont bien définies dans la base

## Données de Test

Pour créer des conventions de test, utilisez le script :
```bash
node scripts/test-conventions-display.js
```

Ce script créera un client avec des conventions si nécessaire.

## Prochaines Étapes

Si le problème persiste après ces vérifications :
1. Notez les messages d'erreur dans la console
2. Vérifiez quel client ID vous essayez de modifier
3. Partagez les logs de la console pour une analyse plus approfondie