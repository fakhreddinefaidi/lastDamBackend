# 🔧 Guide : Fixer l'erreur 404 "Injury not found"

## ❌ Problème

L'erreur `404: Injury with ID 507f1f77bcf86cd799439011 not found` signifie que vous essayez d'ajouter une évolution à une blessure qui n'existe pas dans la base de données.

## ✅ Solution : Créer d'abord une blessure

Vous devez **créer une blessure d'abord** pour obtenir un ID valide, puis utiliser cet ID pour ajouter une évolution.

---

## 📋 Étapes pour tester correctement

### **Étape 1 : Créer une blessure**

1. Dans Swagger, trouvez **`POST /api/injury`**
2. Cliquez sur **"Try it out"**
3. Dans **Request body**, entrez :

```json
{
  "type": "muscle",
  "severity": "medium",
  "description": "Douleur à la cuisse droite"
}
```

4. Cliquez sur **"Execute"**

**Réponse attendue (201 Created) :**
```json
{
  "_id": "67890abcdef1234567890123",  ← COPIEZ CET ID !
  "playerId": "user1",
  "type": "muscle",
  "severity": "medium",
  "description": "Douleur à la cuisse droite",
  "status": "surveille",
  "evolutions": [],
  "recommendations": [],
  "createdAt": "2025-11-24T...",
  "updatedAt": "2025-11-24T..."
}
```

**✅ IMPORTANT : Copiez l'`_id` de la réponse !**

---

### **Étape 2 : Utiliser le vrai ID pour ajouter une évolution**

1. Dans Swagger, trouvez **`POST /api/injury/{injuryId}/evolution`**
2. Cliquez sur **"Try it out"**
3. Dans le champ **`injuryId`**, **collez l'ID que vous avez copié** (ex: `67890abcdef1234567890123`)
4. Dans **Request body**, entrez :

```json
{
  "painLevel": 5,
  "note": "Mieux aujourd'hui"
}
```

5. Cliquez sur **"Execute"**

**✅ Ça devrait fonctionner maintenant !**

---

## 🎯 Scénario de test complet

### **1. Créer la blessure**
```
POST /api/injury
{
  "type": "muscle",
  "severity": "medium",
  "description": "Test injury"
}
```
→ **Copiez l'`_id` de la réponse**

### **2. Ajouter une évolution**
```
POST /api/injury/{COLLER_L_ID_ICI}/evolution
{
  "painLevel": 5,
  "note": "Test evolution"
}
```

### **3. Vérifier l'historique**
```
GET /api/injury/my
```
→ Vous devriez voir la blessure avec l'évolution ajoutée

---

## ⚠️ Erreurs courantes

### **Erreur : Utiliser un ID de test**
❌ **Mauvais :** Utiliser `507f1f77bcf86cd799439011` (ID d'exemple)
✅ **Bon :** Créer d'abord une blessure et utiliser son vrai ID

### **Erreur : ID incorrect**
❌ **Mauvais :** `507f1f77bcf86cd799439011` (n'existe pas)
✅ **Bon :** `67890abcdef1234567890123` (ID réel de votre blessure)

---

## 💡 Astuce

Pour éviter cette erreur :
1. **Toujours créer la blessure d'abord**
2. **Copier l'ID de la réponse**
3. **Utiliser cet ID pour les autres opérations**

---

## 🔍 Vérifier si une blessure existe

Pour voir toutes vos blessures :
```
GET /api/injury/my
```

Cela vous donnera la liste de toutes vos blessures avec leurs IDs.

---

**✅ Maintenant vous savez comment éviter l'erreur 404 !**

