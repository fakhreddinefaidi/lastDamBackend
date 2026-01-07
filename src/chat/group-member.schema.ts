import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GroupMemberDocument = GroupMember & Document;

export enum GroupMemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Schema({ timestamps: true })
export class GroupMember {
  @Prop({ required: true, type: String })
  groupId: string;

  @Prop({ required: true, type: String })
  userId: string;

  @Prop({
    type: String,
    enum: GroupMemberRole,
    default: GroupMemberRole.MEMBER,
  })
  role: GroupMemberRole;

  createdAt?: Date;
  updatedAt?: Date;
}

export const GroupMemberSchema = SchemaFactory.createForClass(GroupMember);

// Compound indexes for efficient queries
GroupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });
GroupMemberSchema.index({ userId: 1 });

