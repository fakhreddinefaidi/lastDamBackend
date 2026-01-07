import { Module } from '@nestjs/common';
import { DietController } from './diet.controller';
import { DietService } from './diet.service';
import { TFLiteLoader } from './utils/tflite.loader';
import { MealPlanGenerator } from './utils/meal-plan.generator';
import { PdfGenerator } from './utils/pdf.generator';

@Module({
  controllers: [DietController],
  providers: [DietService, TFLiteLoader, MealPlanGenerator, PdfGenerator],
  exports: [DietService],
})
export class DietModule {}

