import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GroupMessageDocument = GroupMessage & Document;

@Schema({ timestamps: true })
export class GroupMessage {
  @Prop({ required: true, type: String, index: true })
  groupId: string;

  @Prop({ required: true, type: String, index: true })
  senderId: string;

  @Prop({ required: true, type: String })
  message: string;

  // Track which users have read this message
  @Prop({ type: [String], default: [] })
  readBy: string[];

  @Prop({ default: false, type: Boolean, index: true })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const GroupMessageSchema = SchemaFactory.createForClass(GroupMessage);

// Compound index for efficient group message queries
GroupMessageSchema.index({ groupId: 1, createdAt: -1 });

