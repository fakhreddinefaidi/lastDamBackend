# ✅ Injury ID Numérique - Modification Appliquée

## 🎯 Changement Effectué

L'ID des blessures utilise maintenant un **nombre simple** (1, 2, 3, ...) au lieu d'un ObjectId MongoDB (24 caractères hexadécimaux).

---

## ✅ Modifications Appliquées

### 1. Nouveau Schéma de Compteur
- **Fichier** : `src/injury/injury-counter.schema.ts`
- **Fonction** : Gère l'auto-incrémentation des IDs numériques

### 2. Schéma Injury Modifié
- **Fichier** : `src/injury/injury.schema.ts`
- **Ajout** : Champ `injuryId: number` (unique, indexé)

### 3. Service Mis à Jour
- **Fichier** : `src/injury/injury.service.ts`
- **Changements** :
  - `getNextInjuryId()` : Génère le prochain ID numérique
  - `findOne()` : Recherche par `injuryId` numérique
  - Toutes les méthodes utilisent maintenant l'ID numérique

### 4. Controller Mis à Jour
- **Fichier** : `src/injury/injury.controller.ts`
- **Changements** : Conversion automatique string → number pour les paramètres

---

## 📋 Format de l'ID

### Avant (ObjectId MongoDB)
```
67890abcdef1234567890123
```

### Après (Numérique Simple)
```
1
2
3
...
```

---

## 🔧 Utilisation

### Créer une Blessure

**Endpoint** : `POST /api/v1/injury`

**Réponse** :
```json
{
  "id": 1,
  "injuryId": 1,
  "playerId": "user1",
  "type": "muscle",
  "severity": "medium",
  "description": "Douleur à la cuisse",
  "status": "surveille",
  ...
}
```

**✅ L'ID est maintenant un simple nombre : `1`**

---

### Utiliser l'ID dans les Endpoints

#### Ajouter une Évolution
```
POST /api/v1/injury/1/evolution
```

**Body** :
```json
{
  "painLevel": 5,
  "note": "Mieux aujourd'hui"
}
```

#### Mettre à Jour le Statut
```
PATCH /api/v1/injury/1/status
```

**Body** :
```json
{
  "status": "apte"
}
```

#### Ajouter une Recommandation
```
PATCH /api/v1/injury/1/recommendations
```

**Body** :
```json
{
  "recommendation": "Repos complet 3 jours"
}
```

---

## 📱 Compatibilité

### Support des Deux Formats

Le système accepte toujours les `playerId` pour certaines opérations :

- **ID Numérique** : `1`, `2`, `3` → Recherche par `injuryId`
- **PlayerId** : `"user1"` → Recherche la blessure la plus récente du joueur

**Exemple** :
```
PATCH /api/v1/injury/user1/status
```
→ Met à jour la blessure la plus récente du joueur `user1`

---

## 🔄 Migration des Données Existantes

Si vous avez déjà des blessures dans la base de données :

1. **Les anciennes blessures** continueront d'utiliser leur `_id` MongoDB
2. **Les nouvelles blessures** utiliseront l'ID numérique
3. **Pour migrer** : Créez de nouvelles blessures, elles auront automatiquement un ID numérique

---

## ✅ Avantages

1. **Plus Simple** : `1` au lieu de `67890abcdef1234567890123`
2. **Plus Lisible** : Facile à retenir et utiliser
3. **Séquentiel** : Les IDs sont incrémentés automatiquement (1, 2, 3, ...)
4. **Compatible** : Supporte toujours les `playerId` pour la recherche

---

## 🧪 Test

1. **Créer une blessure** :
   ```bash
   POST /api/v1/injury
   ```

2. **Copier l'ID numérique** de la réponse (ex: `1`)

3. **Utiliser l'ID** :
   ```bash
   POST /api/v1/injury/1/evolution
   ```

---

## 📝 Notes

- Les IDs commencent à `1` et s'incrémentent automatiquement
- Chaque nouvelle blessure obtient le prochain ID disponible
- L'ID est unique et indexé dans MongoDB
- Le champ `_id` MongoDB existe toujours mais n'est plus utilisé pour les recherches

---

*Modification appliquée le: $(date)*

