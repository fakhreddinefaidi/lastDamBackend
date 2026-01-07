import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InjuryController } from './injury.controller';
import { InjuryService } from './injury.service';
import { Injury, InjurySchema } from './injury.schema';
import { InjuryCounter, InjuryCounterSchema } from './injury-counter.schema';
import { RolesGuard } from './guards/roles.guard';
import { PlayerOwnershipGuard } from './guards/player-ownership.guard';
import { TestUserInterceptor } from './interceptors/test-user.interceptor';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Injury.name, schema: InjurySchema },
      { name: InjuryCounter.name, schema: InjuryCounterSchema },
    ]),
  ],
  controllers: [InjuryController],
  providers: [
    InjuryService,
    RolesGuard,
    PlayerOwnershipGuard,
    TestUserInterceptor,
  ],
  exports: [InjuryService],
})
export class InjuryModule {}

