# Diet & Nutrition Module

Professional API for AI-based diet prediction and rule-based meal plan generation.

## Features

### 1. POST /api/diet/predict

Predicts nutritional requirements using AI model (TensorFlow.js TFLite) with fallback to rule-based calculation.

**Input:**
```json
{
  "age": 25,
  "height": 180,
  "weight": 75,
  "position": "midfielder",
  "goal": "performance",
  "trainingIntensity": 7,
  "matchesPerWeek": 2,
  "injuryRisk": "low",
  "bodyfatPercent": 15
}
```

**Output:**
```json
{
  "targetCalories": 2500,
  "protein": 150,
  "carbs": 300,
  "fats": 80,
  "hydration": 3.5
}
```

### 2. POST /api/diet/meal-plan

Generates a daily meal plan based on nutritional targets using rule-based logic.

**Input:**
```json
{
  "targetCalories": 2500,
  "protein": 150,
  "carbs": 300,
  "fats": 80,
  "hydration": 3.5,
  "goal": "performance"
}
```

**Output:**
```json
{
  "breakfast": ["Scrambled eggs (2 whole eggs)", "Greek yogurt (150g)", "Oatmeal (60g dry)", "Whole grain toast (1 slice)", "Almonds (20g)", "Water"],
  "snack1": ["Greek yogurt (100g)", "Banana", "Apple", "Almonds (15g)"],
  "lunch": ["Grilled chicken breast (150g)", "Brown rice (120g cooked)", "Sweet potato (150g)", "Steamed broccoli", "Mixed green salad", "Olive oil dressing (1 tbsp)", "Water"],
  "snack2": ["Greek yogurt (100g)", "Banana", "Apple", "Almonds (15g)"],
  "dinner": ["Salmon fillet (150g)", "Whole wheat pasta (100g cooked)", "Steamed vegetables (mixed)", "Green beans", "Avocado (half)", "Water"],
  "pdfLink": "http://localhost:3002/api/diet/meal-plan/pdf/meal-plan-abc123.pdf",
  "pdfFilename": "meal-plan-abc123.pdf"
}
```

### 3. GET /api/diet/meal-plan/pdf/:filename

Downloads the generated PDF file for a meal plan.

**Example:**
```
GET /api/diet/meal-plan/pdf/meal-plan-abc123.pdf
```

**Response:** PDF file download

## Rule-Based Logic

### High Protein
- Adds chicken, tuna, eggs to meals
- Increases protein portions when target > 150g

### Fat Loss Goal
- Reduces carbs by 20%
- Adjusts meal portions accordingly

### High Hydration (> 4L)
- Includes electrolyte drinks
- Adds hydration supplements to meals

### High Carbs (> 400g)
- Includes more rice, pasta, oats
- Increases carbohydrate-rich foods

## Architecture

```
diet/
├── diet.controller.ts       # REST API endpoints
├── diet.service.ts           # Business logic
├── diet.module.ts            # NestJS module
├── dto/
│   ├── predict.dto.ts        # Prediction input validation
│   └── meal-plan.dto.ts      # Meal plan input/output DTOs
└── utils/
    ├── tflite.loader.ts      # TensorFlow.js model loader
    └── meal-plan.generator.ts # Rule-based meal plan generator
```

## Installation

### Required: PDF Generation

For PDF generation functionality:

```bash
npm install pdfkit uuid
npm install --save-dev @types/uuid
```

### Optional: TensorFlow.js (for AI model)

If you want to use the AI model (currently uses fallback calculation):

```bash
npm install @tensorflow/tfjs-node
```

### Model File

Place your converted TensorFlow.js model at:
```
models/football_diet_model.tflite
```

**Note:** TensorFlow.js doesn't natively support .tflite files. You need to:
1. Convert .tflite to TensorFlow.js format using `tfjs-converter`
2. Or use a Python microservice with TensorFlow Lite
3. Or use ONNX.js if converted to ONNX format

## Usage

### Swagger Documentation

Access the API documentation at:
```
http://localhost:3002/api/docs
```

Navigate to the "Diet & Nutrition" section.

### PDF Generation

When you generate a meal plan, the response includes:
- `pdfLink`: Direct download link for the PDF
- `pdfFilename`: Filename of the generated PDF

The PDF includes:
- Nutritional recommendations (calories, protein, carbs, fats, hydration)
- Complete daily meal plan (breakfast, snacks, lunch, dinner)
- Professional formatting with colors and structure

PDFs are stored in `uploads/pdfs/` directory and can be downloaded via the provided link.

### Example: Predict Nutrition

```bash
curl -X POST http://localhost:3002/api/diet/predict \
  -H "Content-Type: application/json" \
  -d '{
    "age": 25,
    "height": 180,
    "weight": 75,
    "position": "midfielder",
    "goal": "performance",
    "trainingIntensity": 7,
    "matchesPerWeek": 2,
    "injuryRisk": "low",
    "bodyfatPercent": 15
  }'
```

### Example: Generate Meal Plan

```bash
curl -X POST http://localhost:3002/api/diet/meal-plan \
  -H "Content-Type: application/json" \
  -d '{
    "targetCalories": 2500,
    "protein": 150,
    "carbs": 300,
    "fats": 80,
    "hydration": 3.5,
    "goal": "performance"
  }'
```

## Validation

All inputs are validated using `class-validator`:

- **Age**: 15-50 years
- **Height**: 150-220 cm
- **Weight**: 40-150 kg
- **Training Intensity**: 1-10 scale
- **Matches Per Week**: 0-7
- **Body Fat**: 5-40%
- **Calories**: 1000-5000 kcal
- **Protein**: 50-300g
- **Carbs**: 100-600g
- **Fats**: 30-200g
- **Hydration**: 1-8L

## Fallback Calculation

When the AI model is not available, the system uses a rule-based calculation:

1. **BMR Calculation**: Mifflin-St Jeor Equation
2. **Activity Multiplier**: Based on training intensity and matches
3. **Goal Adjustment**: Weight loss (-15%), Muscle gain (+15%), Performance (+5%)
4. **Position Multipliers**: Different multipliers for each position
5. **Injury Risk**: Higher risk = more recovery calories
6. **Macronutrients**: Calculated based on percentages and body weight

## Documentation Supplémentaire

- **PROMPT_INTEGRATION_FRONTEND.md** : ⭐ Guide complet d'intégration Android avec code Kotlin/Compose
- **GUIDE_TEST_PDF.md** : Guide complet pour tester la génération PDF étape par étape
- **EXEMPLE_REPONSE_COMPLETE.md** : Exemples de réponses complètes avec code d'intégration
- **INSTALLATION.md** : Guide d'installation des dépendances

## Production Ready

✅ Complete input validation  
✅ Strong typing with interfaces  
✅ Professional NestJS architecture  
✅ Comprehensive error handling  
✅ Swagger documentation  
✅ PDF generation with download links  
✅ No TODOs  
✅ Ready for production use

