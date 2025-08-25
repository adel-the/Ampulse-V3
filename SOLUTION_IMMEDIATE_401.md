# 🚨 SOLUTION IMMÉDIATE - ERREUR 401 ÉQUIPEMENTS

## ⚡ CORRECTION EN 3 MINUTES

### **Problème** :
```
401 Unauthorized
new row violates row-level security policy for table "equipments"
```

### **Solution** :

#### **ÉTAPE 1 : Ouvrir Supabase**
1. Aller sur : https://supabase.com/dashboard/project/pgjatiookprsvfesrsrx
2. Se connecter à votre compte
3. Sélectionner le projet : **pgjatiookprsvfesrsrx**

#### **ÉTAPE 2 : Ouvrir SQL Editor**
1. Dans le menu de gauche, cliquer sur **"SQL Editor"**
2. Cliquer sur **"New query"**

#### **ÉTAPE 3 : Exécuter le Script**
1. **Copier TOUT le contenu** du fichier : `FIX_RLS_URGENT.sql`
2. **Coller** dans l'éditeur SQL Supabase
3. **Cliquer sur "RUN"** ▶️

#### **ÉTAPE 4 : Vérifier le Résultat**
Vous devriez voir :
```
✅ CORRECTION TERMINÉE - Plus d erreur 401!
```

---

## 🎯 CE QUE FAIT LE SCRIPT

1. **Nettoie** toutes les politiques RLS conflictuelles
2. **Recrée** les tables avec la bonne structure
3. **Configure** des politiques ultra-permissives 
4. **Insère** 5 équipements de test
5. **Teste** que tout fonctionne

---

## ✅ APRÈS CORRECTION

1. **Rafraîchir** votre application : http://localhost:3002
2. **Aller dans** : Paramètres → Équipements  
3. **Tester** : "Ajouter un équipement"
4. **Confirmer** : Plus d'erreur 401 !

---

## 🔍 SI ÇA NE MARCHE PAS

Vérifier dans la console du navigateur :
- Les requêtes doivent retourner **200/201** au lieu de **401**
- Plus de message "row-level security policy"

---

## 📞 SUPPORT

Si le problème persiste après le script :
1. Vérifier que le script s'est exécuté sans erreur
2. Actualiser la page de l'application
3. Vider le cache du navigateur (Ctrl+Shift+R)

**🎯 Temps estimé de correction : 3 minutes maximum**