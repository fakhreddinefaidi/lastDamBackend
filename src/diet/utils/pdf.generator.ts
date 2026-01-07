import { Injectable, Logger } from '@nestjs/common';
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';

// PDFKit will be loaded dynamically if available
let PDFDocument: any = null;
try {
  PDFDocument = require('pdfkit');
} catch (error) {
  // PDFKit not installed
}

// UUID will be loaded dynamically if available
let uuidv4: (() => string) | null = null;
try {
  const uuid = require('uuid');
  uuidv4 = uuid.v4;
} catch (error) {
  // UUID not installed - will use alternative method
}

@Injectable()
export class PdfGenerator {
  private readonly logger = new Logger(PdfGenerator.name);
  private readonly pdfsDirectory = join(process.cwd(), 'uploads', 'pdfs');

  constructor() {
    // Ensure PDFs directory exists
    if (!existsSync(this.pdfsDirectory)) {
      mkdirSync(this.pdfsDirectory, { recursive: true });
    }
  }

  /**
   * Generate PDF for meal plan
   */
  async generateMealPlanPdf(
    mealPlan: {
      breakfast: string[];
      snack1: string[];
      lunch: string[];
      snack2: string[];
      dinner: string[];
    },
    nutritionalData: {
      targetCalories: number;
      protein: number;
      carbs: number;
      fats: number;
      hydration: number;
    },
  ): Promise<{ filename: string; filepath: string }> {
    if (!PDFDocument) {
      throw new Error(
        'PDFKit is not installed. Please run: npm install pdfkit',
      );
    }

    // Generate unique filename
    const uniqueId = uuidv4
      ? uuidv4()
      : `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const filename = `meal-plan-${uniqueId}.pdf`;
    const filepath = join(this.pdfsDirectory, filename);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
        });

        const stream = createWriteStream(filepath);
        doc.pipe(stream);

        // Header
        doc
          .fontSize(24)
          .fillColor('#6B46C1')
          .text('Plan de Repas Quotidien', { align: 'center' })
          .moveDown(0.5);

        // Nutritional Summary
        doc
          .fontSize(16)
          .fillColor('#000000')
          .text('Recommandations Nutritionnelles', { align: 'left' })
          .moveDown(0.3);

        doc.fontSize(12);
        doc
          .fillColor('#DC2626')
          .text(`Calories cibles: ${nutritionalData.targetCalories} kcal/jour`, {
            indent: 20,
          })
          .fillColor('#16A34A')
          .text(`Protéines: ${nutritionalData.protein} g`, { indent: 20 })
          .text(`Glucides: ${nutritionalData.carbs} g`, { indent: 20 })
          .text(`Lipides: ${nutritionalData.fats} g`, { indent: 20 })
          .text(`Hydratation: ${nutritionalData.hydration} L`, { indent: 20 })
          .moveDown(0.5);

        // Estimated Calories
        doc
          .fontSize(14)
          .fillColor('#000000')
          .text(`Calories estimées: ${nutritionalData.targetCalories} kcal`, {
            align: 'right',
          })
          .moveDown(1);

        // Breakfast
        doc
          .fontSize(16)
          .fillColor('#6B46C1')
          .text('Petit-déjeuner', { underline: true })
          .moveDown(0.3);
        doc.fontSize(12).fillColor('#000000');
        mealPlan.breakfast.forEach((item) => {
          doc.text(`• ${item}`, { indent: 20 });
        });
        doc.moveDown(0.5);

        // Morning Snack
        doc
          .fontSize(16)
          .fillColor('#6B46C1')
          .text('Collation Matin', { underline: true })
          .moveDown(0.3);
        doc.fontSize(12).fillColor('#000000');
        mealPlan.snack1.forEach((item) => {
          doc.text(`• ${item}`, { indent: 20 });
        });
        doc.moveDown(0.5);

        // Lunch
        doc
          .fontSize(16)
          .fillColor('#6B46C1')
          .text('Déjeuner', { underline: true })
          .moveDown(0.3);
        doc.fontSize(12).fillColor('#000000');
        mealPlan.lunch.forEach((item) => {
          doc.text(`• ${item}`, { indent: 20 });
        });
        doc.moveDown(0.5);

        // Afternoon Snack
        doc
          .fontSize(16)
          .fillColor('#6B46C1')
          .text('Collation Après-midi', { underline: true })
          .moveDown(0.3);
        doc.fontSize(12).fillColor('#000000');
        mealPlan.snack2.forEach((item) => {
          doc.text(`• ${item}`, { indent: 20 });
        });
        doc.moveDown(0.5);

        // Dinner
        doc
          .fontSize(16)
          .fillColor('#6B46C1')
          .text('Dîner', { underline: true })
          .moveDown(0.3);
        doc.fontSize(12).fillColor('#000000');
        mealPlan.dinner.forEach((item) => {
          doc.text(`• ${item}`, { indent: 20 });
        });
        doc.moveDown(1);

        // Footer
        doc
          .fontSize(10)
          .fillColor('#666666')
          .text(
            `Généré le ${new Date().toLocaleDateString('fr-FR')} - PeakPlay2`,
            { align: 'center' },
          );

        doc.end();

        // Wait for PDF to be written
        stream.on('finish', () => {
          resolve({ filename, filepath });
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        this.logger.error('Error generating PDF', error);
        reject(error);
      }
    });
  }

  /**
   * Delete PDF file
   */
  deletePdf(filename: string): void {
    const filepath = join(this.pdfsDirectory, filename);
    if (existsSync(filepath)) {
      try {
        unlinkSync(filepath);
        this.logger.log(`Deleted PDF: ${filename}`);
      } catch (error) {
        this.logger.error(`Error deleting PDF ${filename}`, error);
      }
    }
  }

  /**
   * Get PDF file path
   */
  getPdfPath(filename: string): string {
    return join(this.pdfsDirectory, filename);
  }

  /**
   * Check if PDFKit is available
   */
  isPdfKitAvailable(): boolean {
    return PDFDocument !== null;
  }
}

