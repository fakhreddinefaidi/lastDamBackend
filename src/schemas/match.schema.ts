// src/schemas/match.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export enum Statut {
  PROGRAMME = 'PROGRAMME',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
}

@Schema({ timestamps: true })
export class Match {

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Equipe', required: false })
  id_equipe1: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Equipe', required: false })
  id_equipe2: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Terrain', required: false })
  id_terrain?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', required: false })
  id_arbitre?: mongoose.Types.ObjectId;

  // Details
  @Prop({ required: true })
  date: Date;

  // Scores
  @Prop({ default: 0 })
  score_eq1: number;

  @Prop({ default: 0 })
  score_eq2: number;

  @Prop({ required: true, enum: Statut, default: Statut.PROGRAMME })
  statut: Statut;

  @Prop({ required: true })
  round: number;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Match', default: null })
  nextMatch?: mongoose.Types.ObjectId;

  @Prop({ enum: ['eq1', 'eq2'], default: 'eq1' })
  positionInNextMatch: 'eq1' | 'eq2';

  // ===== CARDS ===== //
  @Prop({
    type: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    default: null,
  })
  cartonJaune: mongoose.Types.ObjectId[] | null;

  @Prop({
    type: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    default: null,
  })
  cartonRouge: mongoose.Types.ObjectId[] | null;

  // ===== GOALS ===== //
  @Prop({
    type: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    default: null,
  })
  But_eq1: mongoose.Types.ObjectId[] | null;

  @Prop({
    type: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    default: null,
  })
  But_eq2: mongoose.Types.ObjectId[] | null;

  // ===== ASSISTS ===== //
  @Prop({
    type: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    default: null,
  })
  assist_eq1: mongoose.Types.ObjectId[] | null;

  @Prop({
    type: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    default: null,
  })
  assist_eq2: mongoose.Types.ObjectId[] | null;

  // ===== MATCH STATISTICS ===== //
  @Prop({ default: 0 })
  corner_eq1: number;

  @Prop({ default: 0 })
  corner_eq2: number;

  @Prop({ default: 0 })
  penalty_eq1: number;

  @Prop({ default: 0 })
  penalty_eq2: number;

  @Prop({
    type: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    default: null,
  })
  offside_eq1: mongoose.Types.ObjectId[] | null;

  @Prop({
    type: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    default: null,
  })
  offside_eq2: mongoose.Types.ObjectId[] | null;
}

export const MatchSchema = SchemaFactory.createForClass(Match);
