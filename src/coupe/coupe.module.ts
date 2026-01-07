// src/coupe/coupe.module.ts
import { Module } from '@nestjs/common';
import { CoupeService } from './coupe.service';
import { CoupeController } from './coupe.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Coupe, CoupeSchema } from 'src/schemas/coupe.schema'; 
import { MatchModule } from 'src/match/match.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Coupe.name, schema: CoupeSchema }]),
     MatchModule, 
  ],
  controllers: [CoupeController],
  providers: [CoupeService],
})
export class CoupeModule {}