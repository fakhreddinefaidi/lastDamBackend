import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class User {

  @Prop({ required: true })
  prenom: string;

  @Prop({ required: true })
  nom: string;

  @Prop({ required: true , unique:true })
  email: string;

  @Prop({ required: true })
  age: Date;

  @Prop({ required: true })
  tel: number;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: ['JOUEUR', 'OWNER', 'ARBITRE'], default: 'JOUEUR' })
  role: string;

  @Prop({ required: false })
  provider?: string;

  @Prop({ required: false })
  providerId?: string;

  @Prop({ required: false, default: false })
  emailVerified?: boolean;

  // Email verification fields
  @Prop({ type: String, default: null })
  verificationCode: string | null;

  @Prop({ type: Date, default: null })
  codeExpiresAt: Date | null;

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  @Prop({ required: false })
  picture?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
