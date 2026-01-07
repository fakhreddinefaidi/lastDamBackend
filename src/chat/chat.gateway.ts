import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { SendGroupMessageDto } from './dto/send-group-message.dto';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(private readonly chatService: ChatService) {}

  /**
   * Get the WebSocket server instance
   * Used by the controller to emit messages
   */
  getServer(): Server {
    return this.server;
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.connectedUsers.delete(client.id);
      this.logger.log(`User ${userId} disconnected`);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Join user's personal room based on userId
   * Room format: `user:${userId}`
   */
  @SubscribeMessage('joinRoom')
  @UsePipes(new ValidationPipe({ transform: true }))
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    if (!data?.userId) {
      client.emit('error', { message: 'userId is required' });
      return;
    }

    const roomId = `user:${data.userId}`;
    void client.join(roomId);
    this.connectedUsers.set(client.id, data.userId);

    this.logger.log(`User ${data.userId} joined room: ${roomId}`);
    client.emit('joinedRoom', { roomId, userId: data.userId });
  }

  /**
   * Send a message and emit to receiver's room
   */
  @SubscribeMessage('sendMessage')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto,
  ) {
    try {
      // Validate payload
      if (!data.senderId || !data.receiverId || !data.message) {
        client.emit('error', {
          message: 'senderId, receiverId, and message are required',
        });
        return;
      }

      // Save message to database
      const savedMessage = await this.chatService.saveMessage(data);

      const messageData = {
        _id: savedMessage._id,
        senderId: savedMessage.senderId,
        receiverId: savedMessage.receiverId,
        message: savedMessage.message,
        isRead: savedMessage.isRead,
        createdAt: savedMessage.createdAt,
        updatedAt: savedMessage.updatedAt,
      };

      // Emit to receiver's room (only if receiver is different from sender)
      if (data.receiverId !== data.senderId) {
        const receiverRoom = `user:${data.receiverId}`;
        this.server.to(receiverRoom).emit('receiveMessage', messageData);
      }

      // Confirm to sender only (to avoid duplication)
      // Use messageSent event instead of receiveMessage to distinguish sent vs received messages
      client.emit('messageSent', messageData);

      this.logger.log(
        `Message sent from ${data.senderId} to ${data.receiverId}`,
      );
    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  // ==================== GROUP WEBSOCKET EVENTS ====================

  /**
   * Join a group room
   * Room format: `group:${groupId}`
   */
  @SubscribeMessage('joinGroupRoom')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleJoinGroupRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string; userId: string },
  ) {
    if (!data?.groupId || !data?.userId) {
      client.emit('error', { message: 'groupId and userId are required' });
      return;
    }

    // Verify user is a member of the group
    const isMember = await this.chatService.isGroupMember(
      data.groupId,
      data.userId,
    );
    if (!isMember) {
      client.emit('error', {
        message: `User ${data.userId} is not a member of group ${data.groupId}`,
      });
      return;
    }

    const roomId = `group:${data.groupId}`;
    void client.join(roomId);

    this.logger.log(
      `User ${data.userId} joined group room: ${roomId}`,
    );
    client.emit('joinedGroupRoom', { roomId, groupId: data.groupId });
  }

  /**
   * Leave a group room
   */
  @SubscribeMessage('leaveGroupRoom')
  @UsePipes(new ValidationPipe({ transform: true }))
  handleLeaveGroupRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    if (!data?.groupId) {
      client.emit('error', { message: 'groupId is required' });
      return;
    }

    const roomId = `group:${data.groupId}`;
    void client.leave(roomId);

    this.logger.log(`Client left group room: ${roomId}`);
    client.emit('leftGroupRoom', { roomId, groupId: data.groupId });
  }

  /**
   * Send a message to a group
   */
  @SubscribeMessage('sendGroupMessage')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async handleSendGroupMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendGroupMessageDto,
  ) {
    try {
      // Validate payload
      if (!data.groupId || !data.senderId || !data.message) {
        client.emit('error', {
          message: 'groupId, senderId, and message are required',
        });
        return;
      }

      // Save message to database
      const savedMessage = await this.chatService.saveGroupMessage(data);

      // Emit to all group members in the group room
      const groupRoom = `group:${data.groupId}`;
      this.server.to(groupRoom).emit('receiveGroupMessage', {
        _id: savedMessage._id,
        groupId: savedMessage.groupId,
        senderId: savedMessage.senderId,
        message: savedMessage.message,
        readBy: savedMessage.readBy,
        createdAt: savedMessage.createdAt,
        updatedAt: savedMessage.updatedAt,
      });

      // Confirm to sender
      client.emit('groupMessageSent', {
        _id: savedMessage._id,
        groupId: savedMessage.groupId,
        senderId: savedMessage.senderId,
        message: savedMessage.message,
        readBy: savedMessage.readBy,
        createdAt: savedMessage.createdAt,
        updatedAt: savedMessage.updatedAt,
      });

      this.logger.log(
        `Group message sent from ${data.senderId} to group ${data.groupId}`,
      );
    } catch (error) {
      this.logger.error('Error sending group message:', error);
      client.emit('error', { message: 'Failed to send group message' });
    }
  }

  @SubscribeMessage('deleteMessage')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; userId: string },
  ) {
    try {
      if (!data.messageId || !data.userId) {
        client.emit('error', {
          message: 'messageId and userId are required',
        });
        return;
      }

      const deletedMessage = await this.chatService.deleteMessage(
        data.messageId,
        data.userId,
      );

      if (!deletedMessage) {
        client.emit('error', { message: 'Message not found' });
        return;
      }

      // Notify receiver
      const receiverRoom = `user:${deletedMessage.receiverId}`;
      this.server.to(receiverRoom).emit('messageDeleted', {
        messageId: deletedMessage._id,
        conversationId: `${deletedMessage.senderId}_${deletedMessage.receiverId}`,
      });

      // Notify sender
      const senderRoom = `user:${deletedMessage.senderId}`;
      this.server.to(senderRoom).emit('messageDeleted', {
        messageId: deletedMessage._id,
        conversationId: `${deletedMessage.senderId}_${deletedMessage.receiverId}`,
      });

      this.logger.log(`Message ${data.messageId} deleted by ${data.userId}`);
    } catch (error) {
      this.logger.error('Error deleting message:', error);
      client.emit('error', {
        message:
          error instanceof Error ? error.message : 'Failed to delete message',
      });
    }
  }

  @SubscribeMessage('deleteGroupMessage')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async handleDeleteGroupMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; userId: string },
  ) {
    try {
      if (!data.messageId || !data.userId) {
        client.emit('error', {
          message: 'messageId and userId are required',
        });
        return;
      }

      const deletedMessage = await this.chatService.deleteGroupMessage(
        data.messageId,
        data.userId,
      );

      if (!deletedMessage) {
        client.emit('error', { message: 'Message not found' });
        return;
      }

      // Notify all group members
      const groupRoom = `group:${deletedMessage.groupId}`;
      this.server.to(groupRoom).emit('groupMessageDeleted', {
        messageId: deletedMessage._id,
        groupId: deletedMessage.groupId,
      });

      this.logger.log(
        `Group message ${data.messageId} deleted by ${data.userId} in group ${deletedMessage.groupId}`,
      );
    } catch (error) {
      this.logger.error('Error deleting group message:', error);
      client.emit('error', {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to delete group message',
      });
    }
  }
}
