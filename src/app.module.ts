import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';

import { TerrainModule } from './terrain/terrain.module';
import { EquipeModule } from './equipe/equipe.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatEquipeModule } from './chat-equipe/chat-equipe.module';
import { MatchModule } from './match/match.module';
import { CoupeModule } from './coupe/coupe.module';
import { StaffModule } from './staff/staff.module';
import { InvitationArbitreModule } from './invitation_arbitre/invitation_arbitre.module';
import { OtpModule } from './otp/otp.module';
import { UploadsModule } from './uploads/uploads.module';
import { MaillotModule } from './maillot/maillot.module';
import { ChatModule } from './chat/chat.module';
import { DietModule } from './diet/diet.module';
import { InjuryModule } from './injury/injury.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('mongoUri'),
      }),
      inject: [ConfigService],
    }),

    UsersModule,
    AuthModule,
    OtpModule,
   
    TerrainModule,
    EquipeModule,
    NotificationsModule,
    ChatEquipeModule,
    MatchModule,
    CoupeModule,
    StaffModule,
    InvitationArbitreModule,
    UploadsModule,
    MaillotModule,
    ChatModule,
    DietModule,
    InjuryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }