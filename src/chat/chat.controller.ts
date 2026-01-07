import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMemberDto, AddMultipleMembersDto } from './dto/add-member.dto';
import { SendGroupMessageDto } from './dto/send-group-message.dto';

@ApiTags('Chat')
@Controller('chat')
@ApiBearerAuth()
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Send a message',
    description:
      'Sends a message between two users. The message is saved to the database and sent in real-time via WebSocket if the receiver is connected.',
  })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        senderId: { type: 'string' },
        receiverId: { type: 'string' },
        message: { type: 'string' },
        isRead: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async sendMessage(@Body() sendMessageDto: SendMessageDto) {
    // Save message to database
    const savedMessage = await this.chatService.saveMessage(sendMessageDto);

    const messageData = {
      _id: savedMessage._id,
      senderId: savedMessage.senderId,
      receiverId: savedMessage.receiverId,
      message: savedMessage.message,
      isRead: savedMessage.isRead,
      createdAt: savedMessage.createdAt,
      updatedAt: savedMessage.updatedAt,
    };

    // Emit to receiver's room via WebSocket (if connected and receiver is different from sender)
    if (sendMessageDto.receiverId !== sendMessageDto.senderId) {
      const receiverRoom = `user:${sendMessageDto.receiverId}`;
      this.chatGateway.getServer().to(receiverRoom).emit('receiveMessage', messageData);
    }

    // Emit to sender's room so they see their own message immediately
    // Use messageSent event to distinguish sent vs received messages
    const senderRoom = `user:${sendMessageDto.senderId}`;
    this.chatGateway.getServer().to(senderRoom).emit('messageSent', messageData);

    return savedMessage;
  }

  @Get('test/users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate test user IDs',
    description:
      'Generates valid MongoDB ObjectIds for testing. Use these IDs to test chat endpoints.',
  })
  @ApiResponse({
    status: 200,
    description: 'Test user IDs generated successfully',
    schema: {
      type: 'object',
      properties: {
        user1: { type: 'string', example: '507f1f77bcf86cd799439011' },
        user2: { type: 'string', example: '507f1f77bcf86cd799439012' },
        user3: { type: 'string', example: '507f1f77bcf86cd799439013' },
        message: {
          type: 'string',
          example: 'Use these IDs to test chat endpoints',
        },
      },
    },
  })
  getTestUserIds() {
    const user1 = new Types.ObjectId().toString();
    const user2 = new Types.ObjectId().toString();
    const user3 = new Types.ObjectId().toString();

    return {
      user1,
      user2,
      user3,
      message:
        'Use these IDs to test chat endpoints. Copy and paste them in Swagger.',
      examples: {
        getConversation: `/api/chat/${user1}/${user2}`,
        getLastMessage: `/api/chat/last/${user1}/${user2}`,
        websocket: {
          joinRoom: { userId: user1 },
          sendMessage: {
            senderId: user1,
            receiverId: user2,
            message: 'Hello!',
          },
        },
      },
    };
  }

  @Get('test/users/simple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate simple test user IDs',
    description:
      'Generates simple user IDs (user1, user2, user3) for easy testing. These are the simplest IDs possible.',
  })
  @ApiResponse({
    status: 200,
    description: 'Simple test user IDs generated successfully',
    schema: {
      type: 'object',
      properties: {
        user1: { type: 'string', example: 'user1' },
        user2: { type: 'string', example: 'user2' },
        user3: { type: 'string', example: 'user3' },
        message: {
          type: 'string',
          example: 'Use these simple IDs to test chat endpoints',
        },
      },
    },
  })
  getSimpleTestUserIds() {
    // IDs très simples
    const user1 = 'user1';
    const user2 = 'user2';
    const user3 = 'user3';

    return {
      user1,
      user2,
      user3,
      message:
        'Use these simple IDs to test chat endpoints. They are easy to remember: user1, user2, user3.',
      examples: {
        getConversation: `/api/chat/${user1}/${user2}`,
        getLastMessage: `/api/chat/last/${user1}/${user2}`,
        websocket: {
          joinRoom: { userId: user1 },
          sendMessage: {
            senderId: user1,
            receiverId: user2,
            message: 'Hello!',
          },
        },
      },
    };
  }

  @Get('test/groups/simple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate simple test group IDs',
    description:
      'Generates simple group IDs (group1, group2, group3) for easy testing. These are the simplest IDs possible.',
  })
  @ApiResponse({
    status: 200,
    description: 'Simple test group IDs generated successfully',
    schema: {
      type: 'object',
      properties: {
        group1: { type: 'string', example: 'group1' },
        group2: { type: 'string', example: 'group2' },
        group3: { type: 'string', example: 'group3' },
        message: {
          type: 'string',
          example: 'Use these simple IDs to test group chat endpoints',
        },
      },
    },
  })
  getSimpleTestGroupIds() {
    // IDs très simples pour les groupes
    const group1 = 'group1';
    const group2 = 'group2';
    const group3 = 'group3';

    return {
      group1,
      group2,
      group3,
      message:
        'Use these simple IDs to test group chat endpoints. They are easy to remember: group1, group2, group3.',
      examples: {
        createGroup: {
          name: 'My Group',
          description: 'Group description',
          creatorId: 'user1',
          groupId: group1,
        },
        getGroup: `/api/chat/groups/${group1}`,
        getMembers: `/api/chat/groups/${group1}/members`,
        sendMessage: `/api/chat/groups/${group1}/send`,
        getMessages: `/api/chat/groups/${group1}/messages`,
      },
    };
  }

  @Get('conversations/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all conversations for a user',
    description:
      'Returns all conversations for a specific user with the last message and unread count for each conversation. This is the endpoint needed to display the conversations list in the mobile app.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user to get conversations for',
    example: 'user1',
  })
  @ApiResponse({
    status: 200,
    description: 'List of conversations retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          otherUserId: { type: 'string' },
          lastMessage: {
            type: 'object',
            nullable: true,
            properties: {
              _id: { type: 'string' },
              senderId: { type: 'string' },
              receiverId: { type: 'string' },
              message: { type: 'string' },
              isRead: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          unreadCount: { type: 'number' },
          lastMessageTime: { type: 'string', format: 'date-time', nullable: true },
        },
      },
    },
  })
  async getAllConversations(@Param('userId') userId: string) {
    return this.chatService.getAllConversations(userId);
  }

  @Get(':user1/:user2')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get conversation history',
    description:
      'Returns the complete conversation history between two users, sorted by creation date ascending',
  })
  @ApiParam({
    name: 'user1',
    description: 'First user ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'user2',
    description: 'Second user ID',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation history retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          senderId: { type: 'string' },
          receiverId: { type: 'string' },
          message: { type: 'string' },
          isRead: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid user IDs' })
  async getConversation(
    @Param('user1') user1: string,
    @Param('user2') user2: string,
  ) {
    return this.chatService.getConversation(user1, user2);
  }

  @Patch('read/:messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark message as read',
    description: 'Marks a specific message as read',
  })
  @ApiParam({
    name: 'messageId',
    description: 'Message ID to mark as read',
    example: '507f1f77bcf86cd799439013',
  })
  @ApiResponse({
    status: 200,
    description: 'Message marked as read successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        senderId: { type: 'string' },
        receiverId: { type: 'string' },
        message: { type: 'string' },
        isRead: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async markAsRead(@Param('messageId') messageId: string) {
    return this.chatService.markAsRead(messageId);
  }

  @Get('last/:user1/:user2')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get last message in conversation',
    description:
      'Returns the last message exchanged between two users in a conversation',
  })
  @ApiParam({
    name: 'user1',
    description: 'First user ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'user2',
    description: 'Second user ID',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: 'Last message retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        senderId: { type: 'string' },
        receiverId: { type: 'string' },
        message: { type: 'string' },
        isRead: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No messages found' })
  async getLastMessage(
    @Param('user1') user1: string,
    @Param('user2') user2: string,
  ) {
    return this.chatService.getLastMessage(user1, user2);
  }

  // ==================== GROUP ENDPOINTS ====================

  @Post('groups')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new group',
    description:
      'Creates a new group chat and adds the creator as an admin member. You can provide a simple groupId (like "group1") in the request body, or let MongoDB generate one automatically.',
  })
  @ApiBody({ type: CreateGroupDto })
  @ApiResponse({
    status: 201,
    description: 'Group created successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        creatorId: { type: 'string' },
        avatar: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createGroup(@Body() createGroupDto: CreateGroupDto) {
    return this.chatService.createGroup(createGroupDto);
  }

  @Get('groups/:groupId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get group by ID',
    description: 'Returns group information by group ID.',
  })
  @ApiParam({
    name: 'groupId',
    description: 'ID of the group (can be a simple ID like "group1" or a MongoDB ObjectId)',
    example: 'group1',
  })
  @ApiResponse({
    status: 200,
    description: 'Group retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getGroup(@Param('groupId') groupId: string) {
    const group = await this.chatService.getGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }
    return group;
  }

  @Get('groups/user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all groups for a user',
    description:
      'Returns all groups that a user is a member of, with last message and unread count for each group.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user',
    example: 'user1',
  })
  @ApiResponse({
    status: 200,
    description: 'List of groups retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          creatorId: { type: 'string' },
          avatar: { type: 'string' },
          memberCount: { type: 'number' },
          lastMessage: {
            type: 'object',
            nullable: true,
            properties: {
              _id: { type: 'string' },
              groupId: { type: 'string' },
              senderId: { type: 'string' },
              message: { type: 'string' },
              readBy: { type: 'array', items: { type: 'string' } },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          unreadCount: { type: 'number' },
          lastMessageTime: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async getUserGroups(@Param('userId') userId: string) {
    return this.chatService.getUserGroups(userId);
  }

  @Get('groups/:groupId/members')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all members of a group',
    description: 'Returns all members of a specific group.',
  })
  @ApiParam({
    name: 'groupId',
    description: 'ID of the group (can be a simple ID like "group1" or a MongoDB ObjectId)',
    example: 'group1',
  })
  @ApiResponse({
    status: 200,
    description: 'List of members retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          groupId: { type: 'string' },
          userId: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'member'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getGroupMembers(@Param('groupId') groupId: string) {
    return this.chatService.getGroupMembers(groupId);
  }

  @Post('groups/:groupId/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a member to a group',
    description: 'Adds a single user to a group.',
  })
  @ApiParam({
    name: 'groupId',
    description: 'ID of the group (can be a simple ID like "group1" or a MongoDB ObjectId)',
    example: 'group1',
  })
  @ApiBody({ type: AddMemberDto })
  @ApiResponse({
    status: 201,
    description: 'Member added successfully',
  })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async addMember(
    @Param('groupId') groupId: string,
    @Body() addMemberDto: AddMemberDto,
  ) {
    const member = await this.chatService.addMemberToGroup(
      groupId,
      addMemberDto.userId,
    );
    return member;
  }

  @Post('groups/:groupId/members/bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add multiple members to a group',
    description: 'Adds multiple users to a group at once.',
  })
  @ApiParam({
    name: 'groupId',
    description: 'ID of the group (can be a simple ID like "group1" or a MongoDB ObjectId)',
    example: 'group1',
  })
  @ApiBody({ type: AddMultipleMembersDto })
  @ApiResponse({
    status: 201,
    description: 'Members added successfully',
  })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async addMultipleMembers(
    @Param('groupId') groupId: string,
    @Body() addMultipleMembersDto: AddMultipleMembersDto,
  ) {
    return this.chatService.addMultipleMembersToGroup(
      groupId,
      addMultipleMembersDto.userIds,
    );
  }

  @Delete('groups/:groupId/members/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove a member from a group',
    description: 'Removes a user from a group.',
  })
  @ApiParam({
    name: 'groupId',
    description: 'ID of the group (can be a simple ID like "group1" or a MongoDB ObjectId)',
    example: 'group1',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user to remove',
    example: 'user2',
  })
  @ApiResponse({
    status: 200,
    description: 'Member removed successfully',
  })
  async removeMember(
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
  ) {
    await this.chatService.removeMemberFromGroup(groupId, userId);
    return { message: 'Member removed successfully' };
  }

  @Get('groups/:groupId/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all messages in a group',
    description: 'Returns the complete message history for a group, sorted by creation date ascending.',
  })
  @ApiParam({
    name: 'groupId',
    description: 'ID of the group (can be a simple ID like "group1" or a MongoDB ObjectId)',
    example: 'group1',
  })
  @ApiResponse({
    status: 200,
    description: 'Group messages retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          groupId: { type: 'string' },
          senderId: { type: 'string' },
          message: { type: 'string' },
          readBy: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async getGroupMessages(@Param('groupId') groupId: string) {
    return this.chatService.getGroupMessages(groupId);
  }

  @Post('groups/:groupId/send')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Send a message to a group',
    description:
      'Sends a message to a group. The message is saved to the database and sent in real-time via WebSocket to all connected group members.',
  })
  @ApiParam({
    name: 'groupId',
    description: 'ID of the group (can be a simple ID like "group1" or a MongoDB ObjectId)',
    example: 'group1',
  })
  @ApiBody({ type: SendGroupMessageDto })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        groupId: { type: 'string' },
        senderId: { type: 'string' },
        message: { type: 'string' },
        readBy: { type: 'array', items: { type: 'string' } },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Group not found or user is not a member' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async sendGroupMessage(
    @Param('groupId') groupId: string,
    @Body() sendGroupMessageDto: SendGroupMessageDto,
  ) {
    // Ensure groupId in body matches param
    sendGroupMessageDto.groupId = groupId;

    // Save message to database
    const savedMessage = await this.chatService.saveGroupMessage(
      sendGroupMessageDto,
    );

    // Emit to all group members via WebSocket
    const groupRoom = `group:${groupId}`;
    this.chatGateway.getServer().to(groupRoom).emit('receiveGroupMessage', {
      _id: savedMessage._id,
      groupId: savedMessage.groupId,
      senderId: savedMessage.senderId,
      message: savedMessage.message,
      readBy: savedMessage.readBy,
      createdAt: savedMessage.createdAt,
      updatedAt: savedMessage.updatedAt,
    });

    return savedMessage;
  }

  @Patch('groups/:groupId/messages/:messageId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark a group message as read',
    description: 'Marks a specific group message as read by a user.',
  })
  @ApiParam({
    name: 'groupId',
    description: 'ID of the group (can be a simple ID like "group1" or a MongoDB ObjectId)',
    example: 'group1',
  })
  @ApiParam({
    name: 'messageId',
    description: 'ID of the message to mark as read',
    example: '507f1f77bcf86cd799439013',
  })
  @ApiResponse({
    status: 200,
    description: 'Message marked as read successfully',
  })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async markGroupMessageAsRead(
    @Param('messageId') messageId: string,
    @Body() body: { userId: string },
  ) {
    return this.chatService.markGroupMessageAsRead(messageId, body.userId);
  }

  @Patch('groups/:groupId/read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark all group messages as read',
    description: 'Marks all messages in a group as read by a user.',
  })
  @ApiParam({
    name: 'groupId',
    description: 'ID of the group (can be a simple ID like "group1" or a MongoDB ObjectId)',
    example: 'group1',
  })
  @ApiResponse({
    status: 200,
    description: 'All messages marked as read successfully',
  })
  async markAllGroupMessagesAsRead(
    @Param('groupId') groupId: string,
    @Body() body: { userId: string },
  ) {
    await this.chatService.markAllGroupMessagesAsRead(groupId, body.userId);
    return { message: 'All messages marked as read successfully' };
  }

  // ==================== DELETE MESSAGES ====================

  @Delete('messages/:messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a private message',
    description:
      'Allows a user to delete their own message. Only the sender can delete their message.',
  })
  @ApiParam({
    name: 'messageId',
    description: 'ID of the message to delete',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your message' })
  async deleteMessage(
    @Param('messageId') messageId: string,
    @Body() body: { userId: string },
  ) {
    const deletedMessage = await this.chatService.deleteMessage(
      messageId,
      body.userId,
    );

    if (!deletedMessage) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Notify receiver via WebSocket
    const receiverRoom = `user:${deletedMessage.receiverId}`;
    this.chatGateway.getServer().to(receiverRoom).emit('messageDeleted', {
      messageId: deletedMessage._id,
      conversationId: `${deletedMessage.senderId}_${deletedMessage.receiverId}`,
    });

    // Notify sender
    const senderRoom = `user:${deletedMessage.senderId}`;
    this.chatGateway.getServer().to(senderRoom).emit('messageDeleted', {
      messageId: deletedMessage._id,
      conversationId: `${deletedMessage.senderId}_${deletedMessage.receiverId}`,
    });

    return {
      message: 'Message deleted successfully',
      messageId: deletedMessage._id,
    };
  }

  @Delete('groups/:groupId/messages/:messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a group message',
    description:
      'Allows a user to delete their own group message. Only the sender can delete their message.',
  })
  @ApiParam({
    name: 'groupId',
    description: 'ID of the group',
    example: 'group1',
  })
  @ApiParam({
    name: 'messageId',
    description: 'ID of the message to delete',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your message' })
  async deleteGroupMessage(
    @Param('messageId') messageId: string,
    @Body() body: { userId: string },
  ) {
    const deletedMessage = await this.chatService.deleteGroupMessage(
      messageId,
      body.userId,
    );

    if (!deletedMessage) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Notify all group members via WebSocket
    const groupRoom = `group:${deletedMessage.groupId}`;
    this.chatGateway.getServer().to(groupRoom).emit('groupMessageDeleted', {
      messageId: deletedMessage._id,
      groupId: deletedMessage.groupId,
    });

    return {
      message: 'Group message deleted successfully',
      messageId: deletedMessage._id,
    };
  }
}
