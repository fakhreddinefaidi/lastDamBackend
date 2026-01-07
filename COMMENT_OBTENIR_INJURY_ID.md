# 📋 Comment Obtenir l'ID d'une Blessure (Injury ID)

## 🎯 3 Façons d'Obtenir un Injury ID

---

## ✅ Méthode 1 : Après Création d'une Blessure (RECOMMANDÉ)

### Étape 1 : Créer une blessure

**Endpoint** : `POST /api/v1/injury`

**Requête** :
```json
{
  "type": "muscle",
  "severity": "medium",
  "description": "Douleur à la cuisse droite"
}
```

**Réponse (201 Created)** :
```json
{
  "_id": "67890abcdef1234567890123",  ← ⭐ COPIEZ CET ID !
  "playerId": "user1",
  "type": "muscle",
  "severity": "medium",
  "description": "Douleur à la cuisse droite",
  "status": "surveille",
  "date": "2025-01-15T10:30:00.000Z",
  "evolutions": [],
  "recommendations": [],
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**✅ L'ID se trouve dans le champ `_id` de la réponse !**

---

## ✅ Méthode 2 : Récupérer la Liste de Vos Blessures (Joueur)

### Endpoint : `GET /api/v1/injury/my`

**Rôle requis** : `JOUEUR`

**Réponse (200 OK)** :
```json
[
  {
    "_id": "67890abcdef1234567890123",  ← ⭐ ID de la première blessure
    "playerId": "user1",
    "type": "muscle",
    "severity": "medium",
    "description": "Douleur à la cuisse droite",
    "status": "surveille",
    "date": "2025-01-15T10:30:00.000Z",
    "evolutions": [],
    "recommendations": []
  },
  {
    "_id": "78901bcdef2345678901234a",  ← ⭐ ID de la deuxième blessure
    "playerId": "user1",
    "type": "ligament",
    "severity": "high",
    "description": "Entorse cheville",
    "status": "indisponible",
    "date": "2025-01-10T08:15:00.000Z",
    "evolutions": [
      {
        "date": "2025-01-11T09:00:00.000Z",
        "painLevel": 7,
        "note": "Toujours douloureux"
      }
    ],
    "recommendations": []
  }
]
```

**✅ Chaque objet dans le tableau a un champ `_id` !**

---

## ✅ Méthode 3 : Récupérer les Blessures d'une Académie (Académie)

### Endpoint : `GET /api/v1/injury/academy/:academyId`

**Rôle requis** : `ACADEMIE`

**Exemple** : `GET /api/v1/injury/academy/academy123`

**Réponse (200 OK)** :
```json
[
  {
    "_id": "67890abcdef1234567890123",  ← ⭐ ID de la blessure
    "playerId": "user1",
    "type": "muscle",
    "severity": "medium",
    "description": "Douleur à la cuisse droite",
    "status": "surveille",
    "date": "2025-01-15T10:30:00.000Z",
    "evolutions": [],
    "recommendations": []
  },
  {
    "_id": "78901bcdef2345678901234a",  ← ⭐ ID d'une autre blessure
    "playerId": "user2",
    "type": "ligament",
    "severity": "high",
    "description": "Entorse cheville",
    "status": "indisponible",
    "date": "2025-01-10T08:15:00.000Z",
    "evolutions": [],
    "recommendations": []
  }
]
```

### Alternative : Toutes les Blessures

**Endpoint** : `GET /api/v1/injury/all`

**Rôle requis** : `ACADEMIE`

**Réponse** : Liste de toutes les blessures avec leurs `_id`

---

## 🔧 Utiliser l'ID Obtenu

Une fois que vous avez l'ID, vous pouvez l'utiliser dans ces endpoints :

### 1. Ajouter une Évolution
```
POST /api/v1/injury/{injuryId}/evolution
```

**Exemple** :
```
POST /api/v1/injury/67890abcdef1234567890123/evolution
```

**Body** :
```json
{
  "painLevel": 5,
  "note": "Mieux aujourd'hui"
}
```

---

### 2. Mettre à Jour le Statut (Académie)
```
PATCH /api/v1/injury/{injuryId}/status
```

**Exemple** :
```
PATCH /api/v1/injury/67890abcdef1234567890123/status
```

**Body** :
```json
{
  "status": "apte"
}
```

**Note** : Vous pouvez aussi utiliser un `playerId` au lieu d'un `injuryId`. Dans ce cas, la blessure la plus récente du joueur sera mise à jour.

---

### 3. Ajouter une Recommandation (Académie)
```
PATCH /api/v1/injury/{injuryId}/recommendations
```

**Exemple** :
```
PATCH /api/v1/injury/67890abcdef1234567890123/recommendations
```

**Body** :
```json
{
  "recommendation": "Repos complet pendant 3 jours"
}
```

---

## 📱 Dans l'Application Android

### Après Création d'une Blessure

Quand vous créez une blessure dans l'app Android, la réponse contient l'`_id` :

```kotlin
// Exemple de réponse après création
data class InjuryResponse(
    @SerializedName("_id")
    val id: String,  // ← Utilisez cet ID !
    val playerId: String,
    val type: String,
    val severity: String,
    val description: String,
    val status: String,
    // ...
)
```

**Sauvegardez cet ID** pour l'utiliser plus tard !

---

### Récupérer la Liste des Blessures

```kotlin
// Appeler GET /api/v1/injury/my
val injuries = apiService.getMyInjuries()

// Chaque blessure a un _id
injuries.forEach { injury ->
    val injuryId = injury._id  // ← Utilisez cet ID !
    // ...
}
```

---

## 🎯 Format de l'ID

L'ID est un **ObjectId MongoDB** :
- **Format** : 24 caractères hexadécimaux
- **Exemple** : `67890abcdef1234567890123`
- **Validation** : `^[0-9a-fA-F]{24}$`

---

## ⚠️ Erreurs Courantes

### Erreur : "Injury not found"

**Cause** : L'ID utilisé n'existe pas dans la base de données.

**Solution** :
1. Vérifiez que vous avez bien copié l'ID complet (24 caractères)
2. Créez d'abord une blessure avec `POST /api/v1/injury`
3. Utilisez l'ID de la réponse

---

### Erreur : "Invalid injury ID format"

**Cause** : L'ID n'est pas au bon format (pas un ObjectId MongoDB valide).

**Solution** :
- Utilisez un ID obtenu depuis une réponse API (format : 24 caractères hexadécimaux)
- Ne créez pas d'ID manuellement

---

## 📝 Résumé

| Méthode | Endpoint | Rôle | Quand Utiliser |
|---------|----------|------|----------------|
| **1. Après création** | `POST /api/v1/injury` | `JOUEUR` | Immédiatement après avoir créé une blessure |
| **2. Liste mes blessures** | `GET /api/v1/injury/my` | `JOUEUR` | Pour voir toutes mes blessures et leurs IDs |
| **3. Liste académie** | `GET /api/v1/injury/academy/:id` | `ACADEMIE` | Pour voir les blessures d'une académie |
| **3b. Toutes les blessures** | `GET /api/v1/injury/all` | `ACADEMIE` | Pour voir toutes les blessures |

---

## ✅ Checklist

- [ ] Créer une blessure avec `POST /api/v1/injury`
- [ ] Copier l'`_id` de la réponse
- [ ] Utiliser cet ID dans les autres endpoints (`/evolution`, `/status`, `/recommendations`)
- [ ] Sauvegarder l'ID dans l'app Android pour utilisation ultérieure

---

*Guide créé le: $(date)*

