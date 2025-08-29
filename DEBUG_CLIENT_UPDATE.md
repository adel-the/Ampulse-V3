# Guide de Débogage - Erreur de Mise à Jour Client

## Problème Identifié
Erreur 400 Bad Request lors de la mise à jour d'un client:
```
PATCH http://127.0.0.1:15421/rest/v1/clients?id=eq.30&select=* 400 (Bad Request)
```

## Solutions Appliquées

### 1. ✅ Amélioration de la Validation des Données
Le fichier `lib/api/clients.ts` a été mis à jour avec:
- Validation stricte de l'ID client
- Nettoyage des données avant envoi
- Validation des enums (client_type, statut)
- Logs détaillés pour le débogage

### 2. ✅ Tests Effectués
- Le client ID 30 peut être mis à jour correctement via l'API
- Les validations fonctionnent comme prévu
- Les types de données sont correctement validés

## Pour Déboguer l'Erreur

### 1. Ouvrir la Console du Navigateur (F12)
Regardez les logs qui commencent par `[API]`:
- `[API] Updating client 30 with data:` - Montre les données envoyées
- `[API] Update error for client 30:` - Montre l'erreur exacte

### 2. Vérifier les Données Envoyées
L'erreur 400 peut venir de:
- **client_type invalide**: Doit être 'Particulier', 'Entreprise' ou 'Association'
- **statut invalide**: Doit être 'actif', 'inactif', 'prospect' ou 'archive'
- **Champs obligatoires manquants**: nom et client_type sont obligatoires

### 3. Tester Manuellement
Exécutez ce script pour tester:
```bash
node scripts/test-client-30-update.js
```

### 4. Vérifier la Configuration Supabase
Assurez-vous que dans `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:15421
NEXT_PUBLIC_SUPABASE_ANON_KEY=[votre_clé]
SUPABASE_SERVICE_ROLE_KEY=[votre_clé_service]
```

## Solutions Possibles

### Si l'erreur persiste:

1. **Vider le cache du navigateur**
   - Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac)

2. **Redémarrer le serveur de développement**
   ```bash
   # Arrêter le serveur (Ctrl+C)
   npm run dev
   ```

3. **Vérifier les permissions de la base de données**
   ```bash
   npx supabase status
   # Vérifier que tous les services sont "running"
   ```

4. **Réinitialiser Supabase local si nécessaire**
   ```bash
   npx supabase db reset
   ```

## Code de Test Rapide

Collez ce code dans la console du navigateur pour tester directement:

```javascript
// Test direct de mise à jour
const testUpdate = async () => {
  const response = await fetch('/api/clients/30', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nom: 'Test Update ' + Date.now(),
      client_type: 'Entreprise',
      statut: 'actif'
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Erreur:', error);
  } else {
    const data = await response.json();
    console.log('Succès:', data);
  }
};

testUpdate();
```

## Fichiers Modifiés
- `lib/api/clients.ts` - Amélioration de la validation et des logs
- `scripts/test-client-30-update.js` - Script de test
- `scripts/debug-client-update.js` - Script de débogage

## Prochaines Étapes
Si l'erreur persiste après ces corrections:
1. Partagez les logs de la console du navigateur
2. Vérifiez quelle page/composant génère l'erreur
3. Testez avec un autre ID de client pour voir si c'est spécifique au client 30