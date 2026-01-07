import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true, type: String, index: true })
  senderId: string;

  @Prop({ required: true, type: String, index: true })
  receiverId: string;

  @Prop({ required: true, type: String })
  message: string;

  @Prop({ default: false, type: Boolean })
  isRead: boolean;

  @Prop({ default: false, type: Boolean, index: true })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Compound index for efficient conversation queries
MessageSchema.index({ senderId: 1, receiverId: 1 });
MessageSchema.index({ receiverId: 1, senderId: 1 });
