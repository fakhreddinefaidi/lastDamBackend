import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/user.schemas';
import { Equipe, EquipeSchema } from 'src/schemas/equipe.schema';
import { Match, MatchSchema } from 'src/schemas/match.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Equipe.name, schema: EquipeSchema },
      { name: Match.name, schema: MatchSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  // CORRECTION: Ajoutez 'exports' pour rendre UsersService accessible à AuthModule
  exports: [UsersService], 
})
export class UsersModule {}