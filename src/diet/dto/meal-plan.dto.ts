import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { PlayerGoal } from './predict.dto';

export class MealPlanDto {
  @ApiProperty({
    description: 'Target daily calories',
    example: 2500,
    minimum: 1000,
    maximum: 5000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1000)
  @Max(5000)
  targetCalories: number;

  @ApiProperty({
    description: 'Target daily protein in grams',
    example: 150,
    minimum: 50,
    maximum: 300,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(50)
  @Max(300)
  protein: number;

  @ApiProperty({
    description: 'Target daily carbohydrates in grams',
    example: 300,
    minimum: 100,
    maximum: 600,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(100)
  @Max(600)
  carbs: number;

  @ApiProperty({
    description: 'Target daily fats in grams',
    example: 80,
    minimum: 30,
    maximum: 200,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(30)
  @Max(200)
  fats: number;

  @ApiProperty({
    description: 'Target daily hydration in liters',
    example: 3.5,
    minimum: 1,
    maximum: 8,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(8)
  hydration: number;

  @ApiProperty({
    description: 'Player fitness goal',
    enum: PlayerGoal,
    example: PlayerGoal.PERFORMANCE,
  })
  @IsNotEmpty()
  @IsEnum(PlayerGoal)
  goal: PlayerGoal;
}

export class MealPlanResponseDto {
  @ApiProperty({
    description: 'Breakfast meal items',
    example: ['Oatmeal with banana', 'Greek yogurt', 'Whole grain toast'],
    type: [String],
  })
  breakfast: string[];

  @ApiProperty({
    description: 'Morning snack items',
    example: ['Apple', 'Almonds'],
    type: [String],
  })
  snack1: string[];

  @ApiProperty({
    description: 'Lunch meal items',
    example: ['Grilled chicken breast', 'Brown rice', 'Steamed vegetables'],
    type: [String],
  })
  lunch: string[];

  @ApiProperty({
    description: 'Afternoon snack items',
    example: ['Protein shake', 'Banana'],
    type: [String],
  })
  snack2: string[];

  @ApiProperty({
    description: 'Dinner meal items',
    example: ['Salmon fillet', 'Sweet potato', 'Green salad'],
    type: [String],
  })
  dinner: string[];

  @ApiProperty({
    description: 'PDF download link for the meal plan',
    example: 'http://localhost:3002/api/diet/meal-plan/pdf/meal-plan-abc123.pdf',
    required: false,
  })
  pdfLink?: string;

  @ApiProperty({
    description: 'PDF filename',
    example: 'meal-plan-abc123.pdf',
    required: false,
  })
  pdfFilename?: string;
}

