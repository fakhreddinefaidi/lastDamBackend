// src/match/match.module.ts
import { Module } from '@nestjs/common';
import { MatchService } from './match.service';
import { MatchController } from './match.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Match, MatchSchema } from 'src/schemas/match.schema';
import { Equipe, EquipeSchema } from 'src/schemas/equipe.schema';
import { User, UserSchema } from 'src/schemas/user.schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Match.name, schema: MatchSchema },
      { name: Equipe.name, schema: EquipeSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [MatchController],
  providers: [MatchService],

  // ⭐⭐ C'EST ÇA QUI MANQUE ⭐⭐
  exports: [
    MongooseModule,
  ],
})
export class MatchModule { }
