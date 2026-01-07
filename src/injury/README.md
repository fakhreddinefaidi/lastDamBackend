# Injury Management Module

Module complet pour la gestion des blessures et de la santé des joueurs dans PeakPlay2.

## 📋 Fonctionnalités

### Joueur (Player)
- ✅ Déclarer une blessure
- ✅ Ajouter une évolution quotidienne (niveau de douleur, note)
- ✅ Voir son historique de blessures
- ❌ Ne peut pas modifier le statut médical
- ❌ Ne peut pas voir les données d'autres joueurs

### Académie (Academy)
- ✅ Voir toutes les blessures des joueurs de son académie
- ✅ Mettre à jour le statut médical des joueurs
- ✅ Ajouter des recommandations médicales
- ✅ Marquer un joueur comme "Apte", "À surveiller", "Indisponible"
- ✅ Reçoit des notifications quand un joueur déclare une blessure
- ❌ Ne peut pas voir les blessures d'autres académies

### Arbitre (Referee)
- ✅ Voir uniquement les joueurs indisponibles lors des matchs
- ❌ Ne peut pas déclarer de blessures
- ❌ Ne peut pas modifier les blessures

## 🏗️ Structure

```
src/injury/
├── injury.module.ts              # Module principal
├── injury.controller.ts          # Contrôleur REST
├── injury.service.ts              # Service métier
├── injury.schema.ts              # Schéma MongoDB
├── guards/
│   ├── roles.guard.ts            # Guard pour les rôles
│   └── player-ownership.guard.ts # Guard pour vérifier la propriété
└── dto/
    ├── create-injury.dto.ts      # DTO création blessure
    ├── add-evolution.dto.ts      # DTO évolution
    ├── update-status.dto.ts      # DTO mise à jour statut
    └── add-recommendation.dto.ts # DTO recommandation
```

## 📡 API Endpoints

### POST /api/injury
**Rôle requis :** Joueur  
**Description :** Déclarer une nouvelle blessure

**Body :**
```json
{
  "type": "muscle",
  "severity": "medium",
  "description": "Pain in the right thigh during training"
}
```

### POST /api/injury/:injuryId/evolution
**Rôle requis :** Joueur  
**Description :** Ajouter une évolution quotidienne

**Body :**
```json
{
  "painLevel": 5,
  "note": "Feeling better today, less pain"
}
```

### GET /api/injury/my
**Rôle requis :** Joueur  
**Description :** Obtenir son historique de blessures

### GET /api/injury/academy/:academyId
**Rôle requis :** Académie  
**Description :** Voir toutes les blessures de l'académie

### PATCH /api/injury/:injuryId/status
**Rôle requis :** Académie  
**Description :** Mettre à jour le statut médical

**Body :**
```json
{
  "status": "indisponible"
}
```

### PATCH /api/injury/:injuryId/recommendations
**Rôle requis :** Académie  
**Description :** Ajouter une recommandation

**Body :**
```json
{
  "recommendation": "Apply ice 2 times a day for 15 minutes"
}
```

### GET /api/injury/unavailable
**Rôle requis :** Arbitre  
**Description :** Voir tous les joueurs indisponibles

## 🔐 Authentification

Le module nécessite que l'authentification soit déjà en place. Chaque requête doit contenir :
- `req.user.userId` : ID de l'utilisateur
- `req.user.role` : Rôle de l'utilisateur ('joueur', 'academie', 'arbitre')

## 📊 Schéma de données

### Injury
```typescript
{
  _id: ObjectId
  playerId: string
  type: 'muscle' | 'articulation' | 'choc' | 'tendon' | 'fracture' | 'other'
  severity: 'light' | 'medium' | 'severe'
  description: string
  date: Date
  status: 'apte' | 'surveille' | 'indisponible'
  recommendations: string[]
  evolutions: [
    {
      date: Date,
      painLevel: number (0-10),
      note: string
    }
  ]
  createdAt: Date
  updatedAt: Date
}
```

## 🔔 Notifications

La fonction `notifyAcademyAdmin` est un placeholder. Vous devez l'implémenter selon votre système de notifications :
- Email
- Push notifications
- Table de notifications dans la base de données

## ⚠️ Notes importantes

1. **getAcademyInjuries** : Cette méthode nécessite que vous ayez un moyen de récupérer tous les `playerId` d'une académie. Adaptez la logique selon votre système de gestion des utilisateurs.

2. **Guards** : Les guards vérifient les permissions basées sur les rôles. Assurez-vous que votre système d'authentification injecte correctement `req.user`.

3. **Swagger** : Tous les endpoints sont documentés dans Swagger à `/api/docs`.

## 🚀 Utilisation

Le module est automatiquement importé dans `AppModule`. Tous les endpoints sont disponibles sous `/api/injury/*`.

## 📝 Exemple d'utilisation

### Déclarer une blessure (Joueur)
```bash
POST http://localhost:3000/api/injury
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "muscle",
  "severity": "medium",
  "description": "Pain in the right thigh"
}
```

### Ajouter une évolution (Joueur)
```bash
POST http://localhost:3000/api/injury/507f1f77bcf86cd799439011/evolution
Authorization: Bearer <token>
Content-Type: application/json

{
  "painLevel": 3,
  "note": "Much better today"
}
```

### Mettre à jour le statut (Académie)
```bash
PATCH http://localhost:3000/api/injury/507f1f77bcf86cd799439011/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "apte"
}
```

