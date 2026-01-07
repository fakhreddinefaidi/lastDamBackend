import { Injectable, Logger } from '@nestjs/common';
import { TFLiteLoader } from './utils/tflite.loader';
import { MealPlanGenerator } from './utils/meal-plan.generator';
import { PdfGenerator } from './utils/pdf.generator';
import { PredictDto } from './dto/predict.dto';
import { MealPlanDto, MealPlanResponseDto } from './dto/meal-plan.dto';

export interface NutritionPrediction {
  targetCalories: number;
  protein: number;
  carbs: number;
  fats: number;
  hydration: number;
}

@Injectable()
export class DietService {
  private readonly logger = new Logger(DietService.name);

  constructor(
    private readonly tfliteLoader: TFLiteLoader,
    private readonly mealPlanGenerator: MealPlanGenerator,
    private readonly pdfGenerator: PdfGenerator,
  ) {}

  /**
   * Predict nutritional requirements based on player data
   * Uses AI model if available, falls back to rule-based calculation
   */
  async predictNutrition(
    predictDto: PredictDto,
  ): Promise<NutritionPrediction> {
    this.logger.log(
      `Predicting nutrition for player: ${predictDto.position}, goal: ${predictDto.goal}`,
    );

    try {
      const prediction = await this.tfliteLoader.predict({
        age: predictDto.age,
        height: predictDto.height,
        weight: predictDto.weight,
        position: predictDto.position,
        goal: predictDto.goal,
        trainingIntensity: predictDto.trainingIntensity,
        matchesPerWeek: predictDto.matchesPerWeek,
        injuryRisk: predictDto.injuryRisk,
        bodyfatPercent: predictDto.bodyfatPercent,
      });

      this.logger.log(
        `Prediction completed: ${prediction.targetCalories} kcal, ${prediction.protein}g protein`,
      );

      return prediction;
    } catch (error) {
      this.logger.error('Error predicting nutrition', error);
      throw new Error(
        'Failed to predict nutritional requirements. Please try again.',
      );
    }
  }

  /**
   * Generate meal plan based on nutritional targets
   * Uses rule-based logic to create daily meal suggestions
   * Also generates PDF and returns download link
   */
  async generateMealPlan(
    mealPlanDto: MealPlanDto,
    baseUrl: string = process.env.API_BASE_URL || 'http://localhost:3002',
  ): Promise<MealPlanResponseDto> {
    this.logger.log(
      `Generating meal plan: ${mealPlanDto.targetCalories} kcal, goal: ${mealPlanDto.goal}`,
    );

    try {
      const mealPlan = this.mealPlanGenerator.generateMealPlan({
        targetCalories: mealPlanDto.targetCalories,
        protein: mealPlanDto.protein,
        carbs: mealPlanDto.carbs,
        fats: mealPlanDto.fats,
        hydration: mealPlanDto.hydration,
        goal: mealPlanDto.goal,
      });

      this.logger.log(
        `Meal plan generated: ${mealPlan.breakfast.length} breakfast items, ${mealPlan.lunch.length} lunch items`,
      );

      // Generate PDF if PDFKit is available
      let pdfLink: string | undefined;
      let pdfFilename: string | undefined;

      if (this.pdfGenerator.isPdfKitAvailable()) {
        try {
          const { filename } = await this.pdfGenerator.generateMealPlanPdf(
            mealPlan,
            {
              targetCalories: mealPlanDto.targetCalories,
              protein: mealPlanDto.protein,
              carbs: mealPlanDto.carbs,
              fats: mealPlanDto.fats,
              hydration: mealPlanDto.hydration,
            },
          );

          pdfFilename = filename;
          pdfLink = `${baseUrl}/api/diet/meal-plan/pdf/${filename}`;

          this.logger.log(`PDF generated: ${filename}`);
        } catch (error) {
          this.logger.warn('Failed to generate PDF, continuing without it', error);
        }
      } else {
        this.logger.warn(
          'PDFKit not installed. PDF generation skipped. Install with: npm install pdfkit',
        );
      }

      return {
        ...mealPlan,
        pdfLink,
        pdfFilename,
      };
    } catch (error) {
      this.logger.error('Error generating meal plan', error);
      throw new Error('Failed to generate meal plan. Please try again.');
    }
  }
}

