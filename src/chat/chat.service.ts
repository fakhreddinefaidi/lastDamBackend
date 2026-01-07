import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './message.schema';
import { SendMessageDto } from './dto/send-message.dto';
import { Group, GroupDocument } from './group.schema';
import { GroupMember, GroupMemberDocument, GroupMemberRole } from './group-member.schema';
import { GroupMessage, GroupMessageDocument } from './group-message.schema';
import { CreateGroupDto } from './dto/create-group.dto';
import { SendGroupMessageDto } from './dto/send-group-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(GroupMember.name) private groupMemberModel: Model<GroupMemberDocument>,
    @InjectModel(GroupMessage.name) private groupMessageModel: Model<GroupMessageDocument>,
  ) {}

  /**
   * Save a new message to the database
   */
  async saveMessage(data: SendMessageDto): Promise<MessageDocument> {
    const message = new this.messageModel({
      senderId: data.senderId,
      receiverId: data.receiverId,
      message: data.message,
      isRead: false,
    });
    return message.save();
  }

  /**
   * Get complete conversation history between two users
   * Returns messages sorted by createdAt ascending
   */
  async getConversation(
    user1: string,
    user2: string,
  ): Promise<MessageDocument[]> {
    return this.messageModel
      .find({
        $or: [
          { senderId: user1, receiverId: user2 },
          { senderId: user2, receiverId: user1 },
        ],
        isDeleted: false, // Exclude deleted messages
      })
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string): Promise<MessageDocument | null> {
    return this.messageModel
      .findByIdAndUpdate(messageId, { isRead: true }, { new: true })
      .exec();
  }

  /**
   * Get the last message in a conversation between two users
   */
  async getLastMessage(
    user1: string,
    user2: string,
  ): Promise<MessageDocument | null> {
    return this.messageModel
      .findOne({
        $or: [
          { senderId: user1, receiverId: user2 },
          { senderId: user2, receiverId: user1 },
        ],
        isDeleted: false, // Exclude deleted messages
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.messageModel
      .countDocuments({
        receiverId: userId,
        isRead: false,
        isDeleted: false, // Exclude deleted messages
      })
      .exec();
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markConversationAsRead(
    user1: string,
    user2: string,
    currentUserId: string,
  ): Promise<void> {
    await this.messageModel
      .updateMany(
        {
          senderId: { $ne: currentUserId },
          receiverId: currentUserId,
          $or: [
            { senderId: user1, receiverId: user2 },
            { senderId: user2, receiverId: user1 },
          ],
          isRead: false,
        },
        { isRead: true },
      )
      .exec();
  }

  /**
   * Get all conversations for a user
   * Returns list of unique users the current user has conversations with
   * along with the last message for each conversation
   */
  async getAllConversations(userId: string): Promise<any[]> {
    // Get all unique conversation partners (excluding deleted messages)
    const sentMessages = await this.messageModel
      .find({ senderId: userId, isDeleted: false })
      .select('receiverId')
      .distinct('receiverId')
      .exec();

    const receivedMessages = await this.messageModel
      .find({ receiverId: userId, isDeleted: false })
      .select('senderId')
      .distinct('senderId')
      .exec();

    // Combine and get unique user IDs
    const allPartners = [
      ...new Set([...sentMessages, ...receivedMessages]),
    ].filter((id) => id !== userId);

    // Get last message for each conversation
    const conversations = await Promise.all(
      allPartners.map(async (partnerId) => {
        const lastMessage = await this.getLastMessage(userId, partnerId);
        const unreadCount = await this.messageModel
          .countDocuments({
            senderId: partnerId,
            receiverId: userId,
            isRead: false,
            isDeleted: false,
          })
          .exec();

        return {
          otherUserId: partnerId,
          lastMessage: lastMessage
            ? {
                _id: lastMessage._id,
                senderId: lastMessage.senderId,
                receiverId: lastMessage.receiverId,
                message: lastMessage.message,
                isRead: lastMessage.isRead,
                createdAt: lastMessage.createdAt,
                updatedAt: lastMessage.updatedAt,
              }
            : null,
          unreadCount,
          lastMessageTime: lastMessage?.createdAt || null,
        };
      }),
    );

    // Sort by last message time (most recent first)
    return conversations.sort((a, b) => {
      if (!a.lastMessageTime && !b.lastMessageTime) return 0;
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return (
        new Date(b.lastMessageTime).getTime() -
        new Date(a.lastMessageTime).getTime()
      );
    });
  }

  // ==================== GROUP METHODS ====================

  /**
   * Create a new group
   */
  async createGroup(data: CreateGroupDto): Promise<GroupDocument> {
    const groupData: any = {
      name: data.name,
      description: data.description,
      creatorId: data.creatorId,
      avatar: data.avatar,
    };

    // If groupId is provided, use it as groupId field (for simple IDs like "group1")
    if (data.groupId) {
      groupData.groupId = data.groupId;
    }

    const group = new this.groupModel(groupData);
    const savedGroup = await group.save();

    // Use groupId if available, otherwise use _id
    const groupIdentifier = savedGroup.groupId || savedGroup._id.toString();

    // Add creator as admin member
    await this.groupMemberModel.create({
      groupId: groupIdentifier,
      userId: data.creatorId,
      role: GroupMemberRole.ADMIN,
    });

    return savedGroup;
  }

  /**
   * Get a group by ID (can be groupId field or _id)
   */
  async getGroupById(groupId: string): Promise<GroupDocument | null> {
    // Try to find by groupId field first (for simple IDs like "group1")
    const groupBySimpleId = await this.groupModel.findOne({ groupId }).exec();
    if (groupBySimpleId) {
      return groupBySimpleId;
    }
    // If not found, try by _id (MongoDB ObjectId)
    return this.groupModel.findById(groupId).exec();
  }

  /**
   * Add a member to a group
   */
  async addMemberToGroup(
    groupId: string,
    userId: string,
  ): Promise<GroupMemberDocument> {
    // Check if group exists
    const group = await this.getGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    // Use the same identifier logic as in createGroup
    // Use groupId if available, otherwise use _id
    const groupIdentifier = group.groupId || group._id.toString();

    // Check if user is already a member
    const existingMember = await this.groupMemberModel
      .findOne({ groupId: groupIdentifier, userId })
      .exec();
    if (existingMember) {
      return existingMember;
    }

    // Add member
    const member = new this.groupMemberModel({
      groupId: groupIdentifier,
      userId,
      role: GroupMemberRole.MEMBER,
    });
    return member.save();
  }

  /**
   * Add multiple members to a group
   */
  async addMultipleMembersToGroup(
    groupId: string,
    userIds: string[],
  ): Promise<GroupMemberDocument[]> {
    // Check if group exists
    const group = await this.getGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const members: GroupMemberDocument[] = [];
    for (const userId of userIds) {
      // Check if user is already a member
      const existingMember = await this.groupMemberModel
        .findOne({ groupId, userId })
        .exec();
      if (!existingMember) {
        const member = new this.groupMemberModel({
          groupId,
          userId,
          role: GroupMemberRole.MEMBER,
        });
        members.push(await member.save());
      }
    }
    return members;
  }

  /**
   * Remove a member from a group
   */
  async removeMemberFromGroup(
    groupId: string,
    userId: string,
  ): Promise<void> {
    await this.groupMemberModel.deleteOne({ groupId, userId }).exec();
  }

  /**
   * Get all groups for a user
   */
  async getUserGroups(userId: string): Promise<any[]> {
    const memberships = await this.groupMemberModel
      .find({ userId })
      .select('groupId')
      .exec();

    const groupIds = memberships.map((m) => m.groupId);

    // Find groups by groupId field or _id
    const groups = await this.groupModel
      .find({
        $or: [
          { groupId: { $in: groupIds } },
          { _id: { $in: groupIds } },
        ],
      })
      .exec();

    // Get last message and unread count for each group
    const groupsWithDetails = await Promise.all(
      groups.map(async (group) => {
        // Use groupId if available, otherwise use _id
        const groupIdentifier = group.groupId || group._id.toString();
        
        const lastMessage = await this.getLastGroupMessage(groupIdentifier);
        const unreadCount = await this.getGroupUnreadCount(
          groupIdentifier,
          userId,
        );
        const memberCount = await this.groupMemberModel
          .countDocuments({ groupId: groupIdentifier })
          .exec();

        return {
          _id: group._id,
          groupId: group.groupId, // Include groupId in response
          name: group.name,
          description: group.description,
          creatorId: group.creatorId,
          avatar: group.avatar,
          memberCount,
          lastMessage: lastMessage
            ? {
                _id: lastMessage._id,
                groupId: lastMessage.groupId,
                senderId: lastMessage.senderId,
                message: lastMessage.message,
                readBy: lastMessage.readBy,
                createdAt: lastMessage.createdAt,
                updatedAt: lastMessage.updatedAt,
              }
            : null,
          unreadCount,
          lastMessageTime: lastMessage?.createdAt || null,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt,
        };
      }),
    );

    // Sort by last message time (most recent first)
    return groupsWithDetails.sort((a, b) => {
      if (!a.lastMessageTime && !b.lastMessageTime) return 0;
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return (
        new Date(b.lastMessageTime).getTime() -
        new Date(a.lastMessageTime).getTime()
      );
    });
  }

  /**
   * Get all members of a group
   */
  async getGroupMembers(groupId: string): Promise<GroupMemberDocument[]> {
    return this.groupMemberModel.find({ groupId }).exec();
  }

  /**
   * Check if user is a member of a group
   */
  async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    const member = await this.groupMemberModel
      .findOne({ groupId, userId })
      .exec();
    return !!member;
  }

  /**
   * Save a group message
   */
  async saveGroupMessage(
    data: SendGroupMessageDto,
  ): Promise<GroupMessageDocument> {
    // Verify user is a member of the group
    const isMember = await this.isGroupMember(data.groupId, data.senderId);
    if (!isMember) {
      throw new NotFoundException(
        `User ${data.senderId} is not a member of group ${data.groupId}`,
      );
    }

    const message = new this.groupMessageModel({
      groupId: data.groupId,
      senderId: data.senderId,
      message: data.message,
      readBy: [data.senderId], // Sender has read their own message
    });
    return message.save();
  }

  /**
   * Get all messages for a group
   */
  async getGroupMessages(groupId: string): Promise<GroupMessageDocument[]> {
    return this.groupMessageModel
      .find({ groupId, isDeleted: false }) // Exclude deleted messages
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * Get the last message in a group
   */
  async getLastGroupMessage(
    groupId: string,
  ): Promise<GroupMessageDocument | null> {
    return this.groupMessageModel
      .findOne({ groupId })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Mark a group message as read by a user
   */
  async markGroupMessageAsRead(
    messageId: string,
    userId: string,
  ): Promise<GroupMessageDocument | null> {
    const message = await this.groupMessageModel.findById(messageId).exec();
    if (!message) {
      return null;
    }

    // Add user to readBy array if not already present
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
    }

    return message;
  }

  /**
   * Get unread message count for a user in a group
   */
  async getGroupUnreadCount(
    groupId: string,
    userId: string,
  ): Promise<number> {
    const messages = await this.groupMessageModel
      .find({ groupId, senderId: { $ne: userId } })
      .exec();

    // Count messages where userId is not in readBy array
    return messages.filter((msg) => !msg.readBy.includes(userId)).length;
  }

  /**
   * Mark all messages in a group as read by a user
   */
  async markAllGroupMessagesAsRead(
    groupId: string,
    userId: string,
  ): Promise<void> {
    await this.groupMessageModel
      .updateMany(
        {
          groupId,
          senderId: { $ne: userId },
          readBy: { $ne: userId },
        },
        { $addToSet: { readBy: userId } },
      )
      .exec();
  }

  // ==================== DELETE MESSAGES ====================

  /**
   * Delete a private message (only by sender)
   */
  async deleteMessage(
    messageId: string,
    userId: string,
  ): Promise<MessageDocument | null> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) {
      return null;
    }

    // Only the sender can delete their message
    if (message.senderId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own messages',
      );
    }

    // Soft delete
    message.isDeleted = true;
    message.deletedAt = new Date();
    return message.save();
  }

  /**
   * Delete a group message (only by sender)
   */
  async deleteGroupMessage(
    messageId: string,
    userId: string,
  ): Promise<GroupMessageDocument | null> {
    const message = await this.groupMessageModel.findById(messageId).exec();
    if (!message) {
      return null;
    }

    // Only the sender can delete their message
    if (message.senderId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own messages',
      );
    }

    // Soft delete
    message.isDeleted = true;
    message.deletedAt = new Date();
    return message.save();
  }
}
