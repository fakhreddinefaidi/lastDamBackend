# Guide d'intégration Frontend - Register & Login

## 🔗 URLs des endpoints

- **Base URL** : `http://localhost:5000/api/v1`
- **Register** : `POST http://localhost:5000/api/v1/auth/register`
- **Login** : `POST http://localhost:5000/api/v1/auth/login`
- **Verify Code** : `POST http://localhost:5000/api/v1/auth/verify-code`
- **Send Code** : `POST http://localhost:5000/api/v1/auth/send-code`

## 📝 Format des requêtes

### REGISTER

**URL** : `POST /api/v1/auth/register`

**Headers** :
```
Content-Type: application/json
```

**Body** :
```json
{
  "prenom": "Wassim",
  "nom": "Abdelli",
  "email": "user@example.com",
  "age": "2000-01-01",
  "tel": "123456789",
  "password": "123456",
  "role": "JOUEUR"
}
```

**Réponse Succès (201)** :
```json
{
  "_id": "...",
  "prenom": "Wassim",
  "nom": "Abdelli",
  "email": "user@example.com",
  "age": "2000-01-01T00:00:00.000Z",
  "tel": 123456789,
  "role": "JOUEUR",
  "isVerified": false,
  "message": "Inscription réussie. Veuillez vous connecter.",
  "redirectTo": "login"
}
```

**Réponse Erreur (400)** :
```json
{
  "statusCode": 400,
  "message": "Utilisateur déjà existant",
  "error": "Bad Request"
}
```

### LOGIN

**URL** : `POST /api/v1/auth/login`

**Headers** :
```
Content-Type: application/json
```

**Body** :
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**Réponse Succès (200)** :
```json
{
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "prenom": "Wassim",
    "nom": "Abdelli",
    "role": "JOUEUR",
    "isVerified": true
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Réponse Erreur (401)** :
```json
{
  "statusCode": 401,
  "message": "Email ou mot de passe incorrect",
  "error": "Unauthorized"
}
```

ou

```json
{
  "statusCode": 401,
  "message": "Veuillez vérifier votre email avant de vous connecter.",
  "error": "Unauthorized"
}
```

## 🔧 Exemple de code Frontend (JavaScript/TypeScript)

### REGISTER

```typescript
async function register(userData: {
  prenom: string;
  nom: string;
  email: string;
  age: string;
  tel: string;
  password: string;
  role: 'JOUEUR' | 'OWNER' | 'ARBITRE';
}) {
  try {
    const response = await fetch('http://localhost:5000/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      // Gérer les erreurs
      throw new Error(data.message || 'Erreur lors de l\'inscription');
    }

    // Succès
    console.log('Inscription réussie:', data);
    
    // Rediriger vers login si nécessaire
    if (data.redirectTo === 'login') {
      // Rediriger vers la page de login
      // router.navigate('/login');
    }

    return data;
  } catch (error) {
    console.error('Erreur register:', error);
    throw error;
  }
}
```

### LOGIN

```typescript
async function login(email: string, password: string) {
  try {
    const response = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Gérer les erreurs
      throw new Error(data.message || 'Erreur lors de la connexion');
    }

    // Succès - Stocker le token
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  } catch (error) {
    console.error('Erreur login:', error);
    throw error;
  }
}
```

## ⚠️ Problèmes courants et solutions

### 1. Erreur CORS

**Symptôme** : `Access-Control-Allow-Origin` error dans la console

**Solution** :
- Vérifier que `FRONTEND_URL` dans `.env` correspond à l'URL du frontend
- Exemple : `FRONTEND_URL=http://localhost:4200` (pour Angular)
- Redémarrer le serveur backend après modification

### 2. Erreur 400 - Validation

**Symptôme** : `Bad Request` avec message de validation

**Solutions** :
- Vérifier que tous les champs requis sont présents
- Vérifier le format de l'email
- Vérifier que `role` est l'un de : `JOUEUR`, `OWNER`, `ARBITRE`
- Vérifier que `age` est au format `YYYY-MM-DD`

### 3. Erreur 401 - Compte non vérifié

**Symptôme** : `Veuillez vérifier votre email avant de vous connecter.`

**Solution** :
- L'utilisateur doit d'abord vérifier son email avec `verify-code`
- Le code est envoyé automatiquement lors du register
- Appeler `POST /api/v1/auth/verify-code` avec `{ email, code }`

### 4. Erreur 401 - Email/Mot de passe incorrect

**Symptôme** : `Email ou mot de passe incorrect`

**Solutions** :
- Vérifier que l'email et le mot de passe sont corrects
- Vérifier que le compte est vérifié (`isVerified: true`)

### 5. Erreur de connexion réseau

**Symptôme** : `Failed to fetch` ou `Network error`

**Solutions** :
- Vérifier que le backend est démarré sur le port 5000
- Vérifier l'URL : `http://localhost:5000/api/v1/auth/register`
- Vérifier que le CORS est bien configuré

## 🔍 Débogage

### Vérifier que le backend fonctionne

1. Ouvrir Swagger : `http://localhost:5000/api`
2. Tester les endpoints directement dans Swagger
3. Vérifier les logs du serveur backend

### Vérifier les requêtes depuis le frontend

Ouvrir la console du navigateur (F12) et vérifier :
- L'onglet **Network** pour voir les requêtes HTTP
- Les erreurs dans la console
- Les réponses du serveur

### Tester avec curl

```bash
# Test Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "prenom": "Test",
    "nom": "User",
    "email": "test@example.com",
    "age": "2000-01-01",
    "tel": "123456789",
    "password": "123456",
    "role": "JOUEUR"
  }'

# Test Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }'
```

## ✅ Checklist d'intégration

- [ ] Backend démarré sur le port 5000
- [ ] CORS configuré avec la bonne URL frontend
- [ ] URL correcte : `http://localhost:5000/api/v1/auth/register`
- [ ] Headers `Content-Type: application/json` présents
- [ ] Tous les champs requis sont envoyés
- [ ] Format des données correct (email valide, role valide, etc.)
- [ ] Gestion des erreurs implémentée
- [ ] Token JWT stocké après login
- [ ] Vérification email effectuée avant login

## 📞 Support

Si les problèmes persistent :
1. Vérifier les logs du serveur backend
2. Vérifier la console du navigateur
3. Tester avec Swagger pour isoler le problème
4. Vérifier que MongoDB est accessible

