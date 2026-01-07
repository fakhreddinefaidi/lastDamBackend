// src/schemas/coupe.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';


export enum CoupeCategorie {
  KIDS = 'Kids',
  YOUTH = 'Youth',
  JUNIOR = 'Junior',
  SENIOR = 'Senior',
}

export enum CoupeType {
  TOURNAMENT = 'Tournament',
  LEAGUE = 'League',
}


@Schema({ timestamps: true })
export class Coupe {
  @Prop({ required: true })
  nom: string;

  // Organizer (User with OWNER role)
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  id_organisateur: mongoose.Schema.Types.ObjectId;

  // Participating teams
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Equipe' }], default: [] })
  participants: mongoose.Schema.Types.ObjectId[];

  // Match history
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }], default: [] })
  matches: mongoose.Schema.Types.ObjectId[];

  @Prop({ required: true })
  date_debut: Date;

  @Prop({ required: true })
  date_fin: Date;

  @Prop({ required: true, enum: CoupeCategorie })
  categorie: CoupeCategorie;

  @Prop({ required: true, enum: CoupeType })
  type: CoupeType;
  
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Equipe', required: false })
  id_vainqueur?: mongoose.Schema.Types.ObjectId;

  // --- NEW FIELDS (Optional for backward compatibility) ---
  @Prop({ required: false })
  tournamentName?: string;

  @Prop({ required: false })
  stadium?: string;

  @Prop({ required: false })
  date?: Date;

  @Prop({ required: false })
  time?: string;

  @Prop({ required: false })
  maxParticipants?: number;

  @Prop()
  entryFee?: number;

  @Prop()
  prizePool?: number;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] })
  referee: mongoose.Schema.Types.ObjectId[];

  @Prop({ default: 1 })
  currentRound: number;
  
  @Prop({ default: false })
  isBracketGenerated: boolean;


}

export const CoupeSchema = SchemaFactory.createForClass(Coupe);
