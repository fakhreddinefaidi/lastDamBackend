import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InjuryCounterDocument = InjuryCounter & Document;

@Schema({ collection: 'injury_counters' })
export class InjuryCounter {
  @Prop({ required: true, unique: true, default: 'injuryId' })
  name: string;

  @Prop({ required: true, default: 0 })
  sequence: number;
}

export const InjuryCounterSchema = SchemaFactory.createForClass(InjuryCounter);

