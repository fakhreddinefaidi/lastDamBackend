import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { join } from 'path';

// TensorFlow.js imports - will be loaded dynamically if available
// For production, install: npm install @tensorflow/tfjs-node
let tf: any = null;
try {
  tf = require('@tensorflow/tfjs-node');
} catch (error) {
  // TensorFlow.js not installed - will use fallback calculation
}

@Injectable()
export class TFLiteLoader implements OnModuleInit {
  private readonly logger = new Logger(TFLiteLoader.name);
  private model: any = null;
  private readonly modelPath = join(
    process.cwd(),
    'models',
    'football_diet_model.tflite',
  );

  async onModuleInit() {
    try {
      await this.loadModel();
    } catch (error) {
      this.logger.error('Failed to load TFLite model on module init', error);
    }
  }

  /**
   * Load the TFLite model from file system
   * Note: TensorFlow.js doesn't directly support .tflite files
   * This implementation assumes the model is converted to TensorFlow.js format
   * For .tflite files, you would need to use @tensorflow/tfjs-node with a converter
   * or use a different approach like ONNX.js or a Python microservice
   */
  async loadModel(): Promise<void> {
    try {
      // Check if model file exists
      const modelExists = require('fs').existsSync(this.modelPath);

      if (!modelExists) {
        this.logger.warn(
          `Model file not found at ${this.modelPath}. Using fallback calculation.`,
        );
        return;
      }

      // For .tflite files, we need to use a converter or alternative approach
      // Since TensorFlow.js doesn't natively support .tflite,
      // we'll use a fallback calculation method
      // In production, you would:
      // 1. Convert .tflite to TensorFlow.js format using tfjs-converter
      // 2. Or use a Python microservice with TensorFlow Lite
      // 3. Or use ONNX.js if the model is converted to ONNX format

      this.logger.log('TFLite loader initialized (using fallback calculation)');
    } catch (error) {
      this.logger.error('Error loading model', error);
      throw error;
    }
  }

  /**
   * Predict nutritional requirements using the loaded model
   * Falls back to rule-based calculation if model is not available
   */
  async predict(input: {
    age: number;
    height: number;
    weight: number;
    position: string;
    goal: string;
    trainingIntensity: number;
    matchesPerWeek: number;
    injuryRisk: string;
    bodyfatPercent: number;
  }): Promise<{
    targetCalories: number;
    protein: number;
    carbs: number;
    fats: number;
    hydration: number;
  }> {
    if (this.model) {
      try {
        return await this.predictWithModel(input);
      } catch (error) {
        this.logger.warn('Model prediction failed, using fallback', error);
      }
    }

    // Fallback to rule-based calculation
    return this.calculateNutritionFallback(input);
  }

  /**
   * Predict using the loaded TensorFlow.js model
   */
  private async predictWithModel(input: {
    age: number;
    height: number;
    weight: number;
    position: string;
    goal: string;
    trainingIntensity: number;
    matchesPerWeek: number;
    injuryRisk: string;
    bodyfatPercent: number;
  }): Promise<{
    targetCalories: number;
    protein: number;
    carbs: number;
    fats: number;
    hydration: number;
  }> {
    if (!tf || !this.model) {
      throw new Error('Model not loaded');
    }

    // Normalize inputs for the model
    const normalizedInputs = this.normalizeInputs(input);

    // Create tensor from normalized inputs
    const inputTensor = tf.tensor2d([normalizedInputs]);

    // Run prediction
    const prediction = this.model.predict(inputTensor);

    // Get prediction values
    const values = await prediction.data();

    // Clean up tensors
    inputTensor.dispose();
    prediction.dispose();

    // Denormalize outputs
    return this.denormalizeOutputs(values);
  }

  /**
   * Fallback calculation using rule-based approach
   * This mimics what the AI model would predict
   */
  private calculateNutritionFallback(input: {
    age: number;
    height: number;
    weight: number;
    position: string;
    goal: string;
    trainingIntensity: number;
    matchesPerWeek: number;
    injuryRisk: string;
    bodyfatPercent: number;
  }): {
    targetCalories: number;
    protein: number;
    carbs: number;
    fats: number;
    hydration: number;
  } {
    // Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
    const bmr = 10 * input.weight + 6.25 * input.height - 5 * input.age + 5;

    // Activity multiplier based on training intensity and matches
    const activityMultiplier =
      1.2 +
      input.trainingIntensity * 0.1 +
      input.matchesPerWeek * 0.15;

    // Base calories
    let targetCalories = bmr * activityMultiplier;

    // Adjust based on goal
    switch (input.goal) {
      case 'weight_loss':
        targetCalories *= 0.85; // 15% deficit
        break;
      case 'muscle_gain':
        targetCalories *= 1.15; // 15% surplus
        break;
      case 'performance':
        targetCalories *= 1.05; // 5% surplus for performance
        break;
      case 'maintenance':
      default:
        // No adjustment
        break;
    }

    // Position-based adjustments
    const positionMultipliers: Record<string, number> = {
      goalkeeper: 1.0,
      defender: 1.05,
      midfielder: 1.1,
      forward: 1.08,
    };
    targetCalories *= positionMultipliers[input.position] || 1.0;

    // Injury risk adjustment (higher risk = more recovery calories)
    if (input.injuryRisk === 'high') {
      targetCalories *= 1.1;
    } else if (input.injuryRisk === 'medium') {
      targetCalories *= 1.05;
    }

    // Round to nearest 50
    targetCalories = Math.round(targetCalories / 50) * 50;

    // Calculate macronutrients
    // Protein: 1.8-2.2g per kg body weight (higher for muscle gain)
    let proteinPerKg = 1.8;
    if (input.goal === 'muscle_gain') {
      proteinPerKg = 2.2;
    } else if (input.goal === 'performance') {
      proteinPerKg = 2.0;
    }
    const protein = Math.round(input.weight * proteinPerKg);

    // Carbs: 40-60% of calories (higher for high intensity)
    const carbPercentage = input.trainingIntensity >= 7 ? 0.55 : 0.45;
    const carbs = Math.round((targetCalories * carbPercentage) / 4);

    // Fats: 20-30% of calories
    const fatPercentage = 0.25;
    const fats = Math.round((targetCalories * fatPercentage) / 9);

    // Hydration: base 2.5L + 0.5L per hour of training + match days
    let hydration = 2.5;
    hydration += input.trainingIntensity * 0.3;
    hydration += input.matchesPerWeek * 0.5;
    hydration = Math.round(hydration * 10) / 10; // Round to 1 decimal

    return {
      targetCalories: Math.max(1500, Math.min(4500, targetCalories)),
      protein: Math.max(80, Math.min(250, protein)),
      carbs: Math.max(150, Math.min(500, carbs)),
      fats: Math.max(50, Math.min(150, fats)),
      hydration: Math.max(2.0, Math.min(6.0, hydration)),
    };
  }

  /**
   * Normalize input values for model prediction
   */
  private normalizeInputs(input: {
    age: number;
    height: number;
    weight: number;
    position: string;
    goal: string;
    trainingIntensity: number;
    matchesPerWeek: number;
    injuryRisk: string;
    bodyfatPercent: number;
  }): number[] {
    // Position encoding
    const positionMap: Record<string, number> = {
      goalkeeper: 0,
      defender: 1,
      midfielder: 2,
      forward: 3,
    };

    // Goal encoding
    const goalMap: Record<string, number> = {
      weight_loss: 0,
      maintenance: 1,
      muscle_gain: 2,
      performance: 3,
    };

    // Injury risk encoding
    const riskMap: Record<string, number> = {
      low: 0,
      medium: 1,
      high: 2,
    };

    return [
      (input.age - 20) / 15, // Normalize age around 20
      (input.height - 175) / 20, // Normalize height around 175cm
      (input.weight - 75) / 25, // Normalize weight around 75kg
      positionMap[input.position] / 3, // Normalize position
      goalMap[input.goal] / 3, // Normalize goal
      (input.trainingIntensity - 5) / 5, // Normalize intensity around 5
      input.matchesPerWeek / 7, // Normalize matches
      riskMap[input.injuryRisk] / 2, // Normalize risk
      (input.bodyfatPercent - 15) / 15, // Normalize bodyfat around 15%
    ];
  }

  /**
   * Denormalize output values from model prediction
   */
  private denormalizeOutputs(values: Float32Array | Int32Array | Uint8Array): {
    targetCalories: number;
    protein: number;
    carbs: number;
    fats: number;
    hydration: number;
  } {
    // Assuming model outputs are normalized between 0-1
    // Denormalize based on expected ranges
    return {
      targetCalories: Math.round(values[0] * 3000 + 1500), // 1500-4500 range
      protein: Math.round(values[1] * 170 + 80), // 80-250 range
      carbs: Math.round(values[2] * 350 + 150), // 150-500 range
      fats: Math.round(values[3] * 100 + 50), // 50-150 range
      hydration: Math.round((values[4] * 4 + 2) * 10) / 10, // 2-6 range
    };
  }

  /**
   * Check if model is loaded and ready
   */
  isModelLoaded(): boolean {
    return this.model !== null;
  }
}

