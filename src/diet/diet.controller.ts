import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Res,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { DietService } from './diet.service';
import { PredictDto } from './dto/predict.dto';
import { MealPlanDto, MealPlanResponseDto } from './dto/meal-plan.dto';
import { PdfGenerator } from './utils/pdf.generator';

@ApiTags('Diet & Nutrition')
@Controller('diet')
@ApiBearerAuth()
export class DietController {
  constructor(
    private readonly dietService: DietService,
    private readonly pdfGenerator: PdfGenerator,
  ) {}

  @Post('predict')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Predict nutritional requirements using AI model',
    description:
      'Uses TensorFlow.js TFLite model to predict daily nutritional requirements (calories, protein, carbs, fats, hydration) based on player characteristics, position, goals, and activity level. Falls back to rule-based calculation if model is not available.',
  })
  @ApiBody({ type: PredictDto })
  @ApiResponse({
    status: 200,
    description: 'Nutritional requirements predicted successfully',
    schema: {
      type: 'object',
      properties: {
        targetCalories: {
          type: 'number',
          example: 2500,
          description: 'Target daily calories',
        },
        protein: {
          type: 'number',
          example: 150,
          description: 'Target daily protein in grams',
        },
        carbs: {
          type: 'number',
          example: 300,
          description: 'Target daily carbohydrates in grams',
        },
        fats: {
          type: 'number',
          example: 80,
          description: 'Target daily fats in grams',
        },
        hydration: {
          type: 'number',
          example: 3.5,
          description: 'Target daily hydration in liters',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during prediction',
  })
  async predict(@Body() predictDto: PredictDto) {
    return this.dietService.predictNutrition(predictDto);
  }

  @Post('meal-plan')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Generate rule-based meal plan',
    description:
      'Generates a daily meal plan (breakfast, snacks, lunch, dinner) based on nutritional targets. Uses rule-based logic: high protein adds chicken/tuna/eggs, fat loss reduces carbs by 20%, high hydration includes electrolytes, high carbs includes more rice/pasta/oats.',
  })
  @ApiBody({ type: MealPlanDto })
  @ApiResponse({
    status: 200,
    description: 'Meal plan generated successfully',
    type: MealPlanResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during meal plan generation',
  })
  async generateMealPlan(
    @Body() mealPlanDto: MealPlanDto,
    @Req() req: Request,
  ) {
    // Get base URL from request
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    return this.dietService.generateMealPlan(mealPlanDto, baseUrl);
  }

  @Get('meal-plan/pdf/:filename')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Download meal plan PDF',
    description:
      'Downloads the generated PDF file for a meal plan. The filename is returned in the meal-plan response.',
  })
  @ApiParam({
    name: 'filename',
    description: 'PDF filename (returned in meal-plan response)',
    example: 'meal-plan-abc123.pdf',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF file downloaded successfully',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'PDF file not found',
  })
  async downloadMealPlanPdf(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      const filepath = this.pdfGenerator.getPdfPath(filename);

      if (!existsSync(filepath)) {
        return res.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: `PDF file ${filename} not found`,
        });
      }

      const file = readFileSync(filepath);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.setHeader('Content-Length', file.length);

      return res.send(file);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error downloading PDF file',
      });
    }
  }
}

