import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GroupDocument = Group & Document;

@Schema({ timestamps: true })
export class Group {
  @Prop({ type: String, unique: true, sparse: true, index: true })
  groupId?: string; // Simple ID like "group1" (optional, for easy testing)

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ required: true, type: String, index: true })
  creatorId: string;

  @Prop({ type: String })
  avatar?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const GroupSchema = SchemaFactory.createForClass(Group);

