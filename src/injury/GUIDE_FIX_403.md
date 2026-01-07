# 🔧 Guide : Fixer l'erreur 403 Forbidden

## ✅ Solution appliquée

Le guard `RolesGuard` a été modifié pour créer automatiquement un utilisateur de test s'il n'y en a pas.

## 🎯 Comment ça fonctionne maintenant

Le guard vérifie maintenant :
1. Si `req.user` existe → utilise cet utilisateur
2. Si `req.user` n'existe pas → crée automatiquement un utilisateur de test avec :
   - `userId: 'user1'`
   - `role: 'joueur'` (par défaut)

## 📝 Changer le rôle pour tester différents endpoints

### Pour tester les endpoints **Joueur** (par défaut)
Le guard utilise déjà `role: 'joueur'` par défaut, donc ces endpoints fonctionnent :
- ✅ `POST /api/injury` - Déclarer une blessure
- ✅ `POST /api/injury/:injuryId/evolution` - Ajouter évolution
- ✅ `GET /api/injury/my` - Voir son historique

### Pour tester les endpoints **Académie**

Modifiez temporairement `src/injury/guards/roles.guard.ts` ligne 40 :

```typescript
user = {
  userId: 'user1',
  role: 'academie', // ← Changez ici
};
```

Ensuite testez :
- ✅ `GET /api/injury/academy/:academyId`
- ✅ `PATCH /api/injury/:injuryId/status`
- ✅ `PATCH /api/injury/:injuryId/recommendations`

### Pour tester les endpoints **Arbitre**

Modifiez temporairement `src/injury/guards/roles.guard.ts` ligne 40 :

```typescript
user = {
  userId: 'user1',
  role: 'arbitre', // ← Changez ici
};
```

Ensuite testez :
- ✅ `GET /api/injury/unavailable`

## 🚀 Test maintenant

1. Le serveur devrait se recompiler automatiquement
2. Retournez sur Swagger : `http://localhost:3000/api/docs`
3. Testez `POST /api/injury` → **Ça devrait fonctionner !**

## ⚠️ Important

Cette solution est **temporaire pour les tests**. En production :
1. Implémentez un vrai système d'authentification
2. Supprimez la partie "TEMPORAIRE" du guard
3. Le guard utilisera alors les vrais utilisateurs authentifiés

