import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InjuryDocument = Injury & Document;

export enum InjuryType {
  MUSCLE = 'muscle',
  ARTICULATION = 'articulation',
  CHOC = 'choc',
  TENDON = 'tendon',
  FRACTURE = 'fracture',
  OTHER = 'other',
}

export enum InjurySeverity {
  LIGHT = 'light',
  MEDIUM = 'medium',
  SEVERE = 'severe',
}

export enum MedicalStatus {
  APTE = 'apte',
  SURVEILLE = 'surveille',
  INDISPONIBLE = 'indisponible',
}

export interface Evolution {
  date: Date;
  painLevel: number; // 0-10
  note: string;
}

@Schema({ timestamps: true })
export class Injury {
  @Prop({ required: true, type: Number, unique: true, index: true })
  injuryId: number;

  @Prop({ required: true, type: String, index: true })
  playerId: string;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(InjuryType),
  })
  type: InjuryType;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(InjurySeverity),
  })
  severity: InjurySeverity;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ required: true, type: Date, default: Date.now })
  date: Date;

  @Prop({
    type: String,
    enum: Object.values(MedicalStatus),
    default: MedicalStatus.SURVEILLE,
    index: true,
  })
  status: MedicalStatus;

  @Prop({ type: [String], default: [] })
  recommendations: string[];

  @Prop({
    type: [
      {
        date: { type: Date, required: true },
        painLevel: { type: Number, required: true, min: 0, max: 10 },
        note: { type: String, required: true },
      },
    ],
    default: [],
  })
  evolutions: Evolution[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const InjurySchema = SchemaFactory.createForClass(Injury);

// Indexes for efficient queries
InjurySchema.index({ playerId: 1, createdAt: -1 });
InjurySchema.index({ status: 1 });
InjurySchema.index({ playerId: 1, status: 1 });

