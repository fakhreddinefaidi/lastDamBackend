# Chat Module

Module de chat en temps réel pour l'application mobile PeakPlay2.

## Fonctionnalités

- ✅ Messaging en temps réel avec WebSocket (Socket.IO)
- ✅ Historique des conversations
- ✅ Statut lu/non lu pour chaque message
- ✅ Aperçu du dernier message par conversation
- ✅ Schéma MongoDB pour les messages
- ✅ API REST pour récupérer les historiques
- ✅ Rooms basées sur userId
- ✅ Envoi sécurisé de messages avec senderId et receiverId
- ✅ Timestamps automatiques (createdAt, updatedAt)

## Structure

```
src/chat/
├── chat.module.ts          # Module principal
├── chat.controller.ts      # Contrôleur REST
├── chat.service.ts         # Service métier
├── chat.gateway.ts         # Gateway WebSocket
├── message.schema.ts       # Schéma Mongoose
└── dto/
    ├── send-message.dto.ts # DTO pour l'envoi de messages
    └── mark-read.dto.ts   # DTO pour marquer comme lu
```

## API REST

### GET /api/chat/:user1/:user2
Récupère l'historique complet d'une conversation entre deux utilisateurs.

### PATCH /api/chat/read/:messageId
Marque un message comme lu.

### GET /api/chat/last/:user1/:user2
Récupère le dernier message d'une conversation.

## WebSocket Events

### Client → Server

#### `joinRoom`
Rejoindre la room personnelle de l'utilisateur.

```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

#### `sendMessage`
Envoyer un message.

```json
{
  "senderId": "507f1f77bcf86cd799439011",
  "receiverId": "507f1f77bcf86cd799439012",
  "message": "Hello, how are you?"
}
```

### Server → Client

#### `receiveMessage`
Reçoit un nouveau message.

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "senderId": "507f1f77bcf86cd799439011",
  "receiverId": "507f1f77bcf86cd799439012",
  "message": "Hello, how are you?",
  "isRead": false,
  "createdAt": "2025-11-21T12:00:00.000Z",
  "updatedAt": "2025-11-21T12:00:00.000Z"
}
```

#### `messageSent`
Confirmation d'envoi de message.

#### `joinedRoom`
Confirmation de connexion à la room.

#### `error`
Erreur lors d'une opération.

## Configuration

Ajoutez dans votre fichier `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/peakplay2
```

## Sécurité

Le module est prêt pour l'intégration d'un système d'authentification. Les guards peuvent être ajoutés pour injecter automatiquement le `userId` depuis le token JWT.

