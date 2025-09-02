# 🐛 Instructions de Debug - Création de Tâches

## ✅ **Serveur Opérationnel**
- **URL :** http://localhost:3013
- **Page de test :** http://localhost:3013/debug-maintenance
- **Erreurs webpack :** ✅ Corrigées

## 🧪 **Test Manuel Étape par Étape**

### Étape 1 : Ouvrir la page de test
1. Ouvrir http://localhost:3013/debug-maintenance dans votre navigateur
2. Vérifier que la page se charge sans erreur

### Étape 2 : Ouvrir les outils développeur
1. Appuyer sur **F12** pour ouvrir les DevTools
2. Aller dans l'onglet **Console**
3. Vous devriez voir des logs de connexion Supabase

### Étape 3 : Tester la création de tâche
1. Cliquer sur **"Nouvelle tâche"**
2. Remplir exactement comme ceci :
   - **Titre :** `Chambre 12`
   - **Description :** `Description - Maintenance requise`
   - **Priorité :** `moyenne`
   - Laisser **Chambre** vide (null/non spécifié)
3. Cliquer sur **"Créer la tâche"**

### Étape 4 : Observer les logs de la console
Vous devriez voir des messages comme :
```
🎯 [CreateForm] handleSubmit DÉMARRÉ
📋 Données validées: {...}
🌐 Appel API createMaintenanceTask...
📡 Réponse API: {...}
✅ Tâche créée avec succès !
```

### Étape 5 : Vérifier l'affichage
- La tâche doit apparaître **immédiatement** dans la liste
- Les compteurs doivent se mettre à jour
- Le formulaire doit se fermer

## 🔍 **Diagnostic des Erreurs**

### Si aucun log n'apparaît :
- Le JavaScript ne se charge pas
- Vérifier s'il y a des erreurs de compilation

### Si les logs s'arrêtent à "Appel API" :
- Problème de connectivité Supabase
- Vérifier les variables d'environnement

### Si la tâche ne s'affiche pas malgré "succès" :
- Problème dans les optimistic updates
- Vérifier les filtres (ils devraient se réinitialiser)

## 🛠️ **Test Avancé via Console**

Dans la console du navigateur, vous pouvez également tester directement :

```javascript
// Test direct de l'API
const testData = {
  titre: "Test Console", 
  description: "Test depuis console",
  priorite: "moyenne"
};

// Cette fonction sera disponible si le script est chargé
if (window.testTaskCreation) {
  window.testTaskCreation();
}
```

## 📊 **Vérification Database**

Les tâches créées sont visibles dans :
- L'interface Supabase locale : http://127.0.0.1:15421
- Table : `maintenance_tasks`

## 🚨 **Signaler le Problème**

Si le problème persiste, noter :
1. À quelle étape ça échoue
2. Quels logs apparaissent dans la console
3. Y a-t-il des erreurs en rouge dans la console
4. Le compteur "Total" change-t-il ?

Ces informations permettront d'identifier précisément le problème.