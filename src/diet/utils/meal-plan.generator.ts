import { Injectable } from '@nestjs/common';
import { PlayerGoal } from '../dto/predict.dto';

export interface MealPlanInput {
  targetCalories: number;
  protein: number;
  carbs: number;
  fats: number;
  hydration: number;
  goal: PlayerGoal;
}

export interface MealPlan {
  breakfast: string[];
  snack1: string[];
  lunch: string[];
  snack2: string[];
  dinner: string[];
}

@Injectable()
export class MealPlanGenerator {
  /**
   * Generate a rule-based meal plan based on nutritional targets
   */
  generateMealPlan(input: MealPlanInput): MealPlan {
    const mealPlan: MealPlan = {
      breakfast: [],
      snack1: [],
      lunch: [],
      snack2: [],
      dinner: [],
    };

    // Calculate calories per meal (approximate distribution)
    const breakfastCalories = input.targetCalories * 0.25; // 25%
    const snack1Calories = input.targetCalories * 0.1; // 10%
    const lunchCalories = input.targetCalories * 0.3; // 30%
    const snack2Calories = input.targetCalories * 0.1; // 10%
    const dinnerCalories = input.targetCalories * 0.25; // 25%

    // Adjust carbs for fat loss goal
    let adjustedCarbs = input.carbs;
    if (input.goal === PlayerGoal.WEIGHT_LOSS) {
      adjustedCarbs = Math.round(input.carbs * 0.8); // Reduce by 20%
    }

    // Generate breakfast
    mealPlan.breakfast = this.generateBreakfast(
      breakfastCalories,
      input.protein,
      adjustedCarbs,
      input.fats,
      input.goal,
    );

    // Generate morning snack
    mealPlan.snack1 = this.generateSnack(
      snack1Calories,
      input.protein,
      adjustedCarbs,
      input.goal,
    );

    // Generate lunch
    mealPlan.lunch = this.generateLunch(
      lunchCalories,
      input.protein,
      adjustedCarbs,
      input.fats,
      input.goal,
    );

    // Generate afternoon snack
    mealPlan.snack2 = this.generateSnack(
      snack2Calories,
      input.protein,
      adjustedCarbs,
      input.goal,
    );

    // Generate dinner
    mealPlan.dinner = this.generateDinner(
      dinnerCalories,
      input.protein,
      adjustedCarbs,
      input.fats,
      input.goal,
    );

    // Add hydration recommendations
    if (input.hydration > 4) {
      mealPlan.breakfast.push('Electrolyte drink');
      mealPlan.snack1.push('Water with electrolytes');
      mealPlan.lunch.push('Hydration supplement');
      mealPlan.snack2.push('Electrolyte drink');
      mealPlan.dinner.push('Water with electrolytes');
    } else {
      mealPlan.breakfast.push('Water');
      mealPlan.snack1.push('Water');
      mealPlan.lunch.push('Water');
      mealPlan.snack2.push('Water');
      mealPlan.dinner.push('Water');
    }

    return mealPlan;
  }

  /**
   * Generate breakfast items
   */
  private generateBreakfast(
    calories: number,
    totalProtein: number,
    totalCarbs: number,
    totalFats: number,
    goal: PlayerGoal,
  ): string[] {
    const items: string[] = [];

    // High protein requirement
    if (totalProtein > 150) {
      items.push('Scrambled eggs (3 whole eggs)');
      items.push('Greek yogurt (200g)');
    } else {
      items.push('Scrambled eggs (2 whole eggs)');
      items.push('Greek yogurt (150g)');
    }

    // Carbs based on total carbs
    if (totalCarbs > 400) {
      items.push('Oatmeal (80g dry)');
      items.push('Whole grain toast (2 slices)');
      items.push('Banana');
    } else if (totalCarbs > 300) {
      items.push('Oatmeal (60g dry)');
      items.push('Whole grain toast (1 slice)');
    } else {
      items.push('Oatmeal (50g dry)');
    }

    // Add healthy fats
    items.push('Almonds (20g)');

    // Goal-specific additions
    if (goal === PlayerGoal.MUSCLE_GAIN) {
      items.push('Protein shake');
    }

    return items;
  }

  /**
   * Generate lunch items
   */
  private generateLunch(
    calories: number,
    totalProtein: number,
    totalCarbs: number,
    totalFats: number,
    goal: PlayerGoal,
  ): string[] {
    const items: string[] = [];

    // High protein requirement
    if (totalProtein > 150) {
      items.push('Grilled chicken breast (200g)');
      items.push('Tuna steak (150g)');
    } else {
      items.push('Grilled chicken breast (150g)');
    }

    // Carbs based on total carbs
    if (totalCarbs > 400) {
      items.push('Brown rice (150g cooked)');
      items.push('Sweet potato (200g)');
    } else if (totalCarbs > 300) {
      items.push('Brown rice (120g cooked)');
      items.push('Sweet potato (150g)');
    } else {
      items.push('Brown rice (100g cooked)');
    }

    // Vegetables
    items.push('Steamed broccoli');
    items.push('Mixed green salad');
    items.push('Olive oil dressing (1 tbsp)');

    // Goal-specific additions
    if (goal === PlayerGoal.MUSCLE_GAIN) {
      items.push('Quinoa (100g cooked)');
    }

    return items;
  }

  /**
   * Generate dinner items
   */
  private generateDinner(
    calories: number,
    totalProtein: number,
    totalCarbs: number,
    totalFats: number,
    goal: PlayerGoal,
  ): string[] {
    const items: string[] = [];

    // High protein requirement
    if (totalProtein > 150) {
      items.push('Salmon fillet (200g)');
      items.push('Lean beef (150g)');
    } else {
      items.push('Salmon fillet (150g)');
    }

    // Carbs based on total carbs
    if (totalCarbs > 400) {
      items.push('Whole wheat pasta (120g cooked)');
      items.push('Roasted sweet potato (150g)');
    } else if (totalCarbs > 300) {
      items.push('Whole wheat pasta (100g cooked)');
    } else {
      items.push('Quinoa (80g cooked)');
    }

    // Vegetables
    items.push('Steamed vegetables (mixed)');
    items.push('Green beans');
    items.push('Avocado (half)');

    // Goal-specific additions
    if (goal === PlayerGoal.WEIGHT_LOSS) {
      items.push('Light dressing');
    }

    return items;
  }

  /**
   * Generate snack items
   */
  private generateSnack(
    calories: number,
    totalProtein: number,
    totalCarbs: number,
    goal: PlayerGoal,
  ): string[] {
    const items: string[] = [];

    // High protein requirement
    if (totalProtein > 150) {
      items.push('Protein shake');
      items.push('Hard-boiled eggs (2)');
    } else {
      items.push('Greek yogurt (100g)');
    }

    // Carbs based on total carbs
    if (totalCarbs > 400) {
      items.push('Banana');
      items.push('Apple');
      items.push('Oatmeal bar');
    } else if (totalCarbs > 300) {
      items.push('Banana');
      items.push('Apple');
    } else {
      items.push('Apple');
    }

    // Add nuts for healthy fats
    items.push('Almonds (15g)');

    // Goal-specific additions
    if (goal === PlayerGoal.MUSCLE_GAIN) {
      items.push('Protein bar');
    } else if (goal === PlayerGoal.WEIGHT_LOSS) {
      items.push('Low-fat cottage cheese');
    }

    return items;
  }
}

