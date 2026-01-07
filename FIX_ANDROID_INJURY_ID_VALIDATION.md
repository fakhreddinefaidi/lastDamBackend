# 🔧 Correction : Validation Injury ID dans Android

## ❌ Problème Détecté

L'application Android affiche l'erreur :
```
Erreur: L'ID de blessure semble invalide. Veuillez sélectionner une blessure depuis la liste.
```

**Cause** : La validation côté Android vérifie probablement encore l'ancien format ObjectId MongoDB au lieu du nouveau format numérique.

---

## ✅ Solution Backend

Le backend retourne maintenant correctement `injuryId` dans les réponses :

```json
{
  "_id": "693f80900ca2d300dd68e957",
  "injuryId": 1,
  "playerId": "user1",
  "type": "muscle",
  "severity": "medium",
  "description": "pain pain",
  "status": "surveille",
  ...
}
```

**✅ Le champ `injuryId: 1` est présent !**

---

## 🔧 Correction Frontend Android

### 1. Vérifier le Modèle de Données

**Fichier** : `app/src/main/java/.../models/Injury.kt` (ou similaire)

Assurez-vous que le modèle contient `injuryId` :

```kotlin
data class Injury(
    @SerializedName("_id")
    val id: String? = null,
    
    @SerializedName("injuryId")
    val injuryId: Int? = null,  // ← Vérifier que ce champ existe
    
    @SerializedName("playerId")
    val playerId: String,
    
    @SerializedName("type")
    val type: String,
    
    // ... autres champs
)
```

---

### 2. Corriger la Validation

**Fichier** : Où la validation de l'ID est effectuée

**Avant** (validation ObjectId) :
```kotlin
fun isValidInjuryId(id: String?): Boolean {
    if (id == null) return false
    // Validation ObjectId MongoDB (24 caractères hexadécimaux)
    return id.matches(Regex("^[0-9a-fA-F]{24}$"))
}
```

**Après** (validation numérique) :
```kotlin
fun isValidInjuryId(id: String?): Boolean {
    if (id == null || id.isBlank()) return false
    // Validation ID numérique simple
    return try {
        val numericId = id.toInt()
        numericId > 0  // Les IDs commencent à 1
    } catch (e: NumberFormatException) {
        false
    }
}
```

**Ou pour accepter les deux formats** (compatibilité) :
```kotlin
fun isValidInjuryId(id: String?): Boolean {
    if (id == null || id.isBlank()) return false
    
    // Accepter les IDs numériques (nouveau format)
    return try {
        val numericId = id.toInt()
        numericId > 0
    } catch (e: NumberFormatException) {
        // Accepter aussi les ObjectId (ancien format pour compatibilité)
        id.matches(Regex("^[0-9a-fA-F]{24}$"))
    }
}
```

---

### 3. Utiliser `injuryId` au lieu de `_id`

**Dans les appels API**, utilisez `injuryId` :

```kotlin
// Avant
val injuryId = injury._id  // ❌

// Après
val injuryId = injury.injuryId?.toString() ?: injury._id  // ✅
```

**Exemple complet** :
```kotlin
// Lors de la sélection d'une blessure depuis la liste
fun onInjurySelected(injury: Injury) {
    // Utiliser injuryId si disponible, sinon _id
    val idToUse = injury.injuryId?.toString() 
        ?: injury._id 
        ?: throw IllegalArgumentException("Injury ID is missing")
    
    // Utiliser cet ID dans les requêtes
    updateInjuryStatus(idToUse, newStatus)
    addRecommendation(idToUse, recommendation)
}
```

---

### 4. Mettre à Jour les Endpoints API

**Vérifier que les endpoints utilisent bien `injuryId`** :

```kotlin
// Exemple : Mettre à jour le statut
@PATCH("injury/{injuryId}/status")
suspend fun updateStatus(
    @Path("injuryId") injuryId: String,  // Accepte maintenant "1", "2", etc.
    @Body status: UpdateStatusDto
): Response<Injury>

// Exemple : Ajouter une recommandation
@PATCH("injury/{injuryId}/recommendations")
suspend fun addRecommendation(
    @Path("injuryId") injuryId: String,  // Accepte maintenant "1", "2", etc.
    @Body recommendation: AddRecommendationDto
): Response<Injury>
```

---

### 5. Correction dans l'Écran "Gérer"

**Fichier** : `ActivityInjuryAcademy.kt` ou similaire

**Problème** : Le champ "Injury ID" est vide ou invalide

**Solution** :
```kotlin
// Lors de la sélection depuis la liste
fun onInjurySelectedFromList(injury: Injury) {
    // Récupérer l'ID numérique
    val injuryId = injury.injuryId?.toString() 
        ?: injury._id 
        ?: return
    
    // Mettre à jour le champ "Injury ID" dans le formulaire
    binding.editTextInjuryId.setText(injuryId)
    
    // Valider
    if (isValidInjuryId(injuryId)) {
        // Cacher l'erreur
        binding.textViewError.visibility = View.GONE
    }
}
```

---

## 🧪 Test

### 1. Vérifier la Réponse API

**Appeler** : `GET /api/v1/injury/academy/{academyId}`

**Vérifier** que la réponse contient `injuryId` :
```json
[
  {
    "injuryId": 1,
    "playerId": "user1",
    "type": "muscle",
    ...
  }
]
```

### 2. Tester avec l'ID Numérique

**Appeler** : `PATCH /api/v1/injury/1/status`

**Vérifier** que ça fonctionne avec l'ID `1`

---

## 📝 Checklist de Correction

- [ ] Vérifier que le modèle `Injury` contient `injuryId: Int?`
- [ ] Corriger la fonction de validation `isValidInjuryId()`
- [ ] Utiliser `injury.injuryId` au lieu de `injury._id` dans les appels API
- [ ] Mettre à jour l'écran "Gérer" pour pré-remplir l'ID depuis la liste
- [ ] Tester avec un ID numérique (ex: `1`)
- [ ] Vérifier que l'erreur ne s'affiche plus

---

## ✅ Résumé

**Problème** : Validation Android vérifie encore l'ancien format ObjectId  
**Solution** : 
1. Modifier la validation pour accepter les nombres (`1`, `2`, `3`, ...)
2. Utiliser `injury.injuryId` au lieu de `injury._id`
3. Pré-remplir le champ depuis la liste des blessures

---

*Guide créé le: $(date)*

