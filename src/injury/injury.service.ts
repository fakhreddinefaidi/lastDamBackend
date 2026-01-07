import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Injury,
  InjuryDocument,
  MedicalStatus,
  Evolution,
  InjurySeverity,
} from './injury.schema';
import {
  InjuryCounter,
  InjuryCounterDocument,
} from './injury-counter.schema';
import { CreateInjuryDto } from './dto/create-injury.dto';
import { AddEvolutionDto } from './dto/add-evolution.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AddRecommendationDto } from './dto/add-recommendation.dto';

@Injectable()
export class InjuryService {
  constructor(
    @InjectModel(Injury.name) private injuryModel: Model<InjuryDocument>,
    @InjectModel(InjuryCounter.name)
    private counterModel: Model<InjuryCounterDocument>,
  ) {}

  /**
   * Get next injury ID (auto-increment)
   */
  private async getNextInjuryId(): Promise<number> {
    const counter = await this.counterModel.findOneAndUpdate(
      { name: 'injuryId' },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true },
    );
    return counter.sequence;
  }

  /**
   * Find a single injury by ID (numeric ID)
   */
  async findOne(injuryId: number | string): Promise<InjuryDocument | null> {
    try {
      // Convert to number if string
      const id = typeof injuryId === 'string' ? parseInt(injuryId, 10) : injuryId;
      if (isNaN(id)) {
        return null;
      }
      return this.injuryModel.findOne({ injuryId: id }).exec();
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a new injury (Joueur only)
   */
  async createInjury(
    playerId: string,
    createInjuryDto: CreateInjuryDto,
  ): Promise<any> {
    // Get next injury ID
    const injuryId = await this.getNextInjuryId();

    const injury = new this.injuryModel({
      ...createInjuryDto,
      injuryId,
      playerId,
      date: new Date(),
      status: MedicalStatus.SURVEILLE,
    });

    const savedInjury = await injury.save();

    // Notify academy admin (placeholder)
    await this.notifyAcademyAdmin(playerId, savedInjury);

    return this.transformInjury(savedInjury);
  }

  /**
   * Add daily evolution to an injury (Joueur only)
   */
  async addEvolution(
    injuryId: number | string,
    addEvolutionDto: AddEvolutionDto,
  ): Promise<InjuryDocument> {
    // Convert to number if string
    const id = typeof injuryId === 'string' ? parseInt(injuryId, 10) : injuryId;
    
    if (isNaN(id)) {
      throw new NotFoundException(
        `Invalid injury ID format: ${injuryId}. L'ID doit être un nombre. Créez d'abord une blessure avec POST /api/v1/injury pour obtenir un ID valide.`,
      );
    }

    const injury = await this.findOne(id);
    if (!injury) {
      throw new NotFoundException(
        `Injury with ID ${id} not found. Créez d'abord une blessure avec POST /api/v1/injury pour obtenir un ID valide.`,
      );
    }

    const evolution: Evolution = {
      date: new Date(),
      painLevel: addEvolutionDto.painLevel,
      note: addEvolutionDto.note,
    };

    injury.evolutions.push(evolution);
    return injury.save();
  }

  /**
   * Get severity color based on severity level
   */
  private getSeverityColor(severity: InjurySeverity): string {
    switch (severity) {
      case InjurySeverity.LIGHT:
        return '#4CAF50'; // Green
      case InjurySeverity.MEDIUM:
        return '#FF9800'; // Orange
      case InjurySeverity.SEVERE:
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  }

  /**
   * Transform injury document to include severity color
   */
  private transformInjury(injury: InjuryDocument): any {
    const injuryObj = injury.toObject();
    return {
      ...injuryObj,
      id: injury.injuryId, // Use numeric ID as main identifier
      injuryId: injury.injuryId, // Keep injuryId for compatibility
      severityColor: this.getSeverityColor(injury.severity),
    };
  }

  /**
   * Transform array of injuries to include severity colors
   */
  private transformInjuries(injuries: InjuryDocument[]): any[] {
    return injuries.map((injury) => this.transformInjury(injury));
  }

  /**
   * Get all injuries for a specific player (Joueur only)
   */
  async getPlayerInjuries(playerId: string): Promise<any[]> {
    const injuries = await this.injuryModel
      .find({ playerId })
      .sort({ createdAt: -1 })
      .exec();
    return this.transformInjuries(injuries);
  }

  /**
   * Get all injuries for players in an academy (Académie only)
   */
  async getAcademyInjuries(academyId: string): Promise<any[]> {
    // Note: This assumes you have a way to get all playerIds for an academy
    // For now, this is a placeholder - you'll need to implement the logic
    // to get playerIds from academyId based on your user management system
    // Example: const playerIds = await this.userService.getPlayersByAcademy(academyId);
    // return this.injuryModel.find({ playerId: { $in: playerIds } }).sort({ createdAt: -1 }).exec();

    // Placeholder implementation - returns all injuries for now
    // In production, filter by academyId
    const injuries = await this.injuryModel.find().sort({ createdAt: -1 }).exec();
    return this.transformInjuries(injuries);
  }

  /**
   * Get all injuries (Académie only) - simplified endpoint without academyId
   */
  async getAllInjuries(): Promise<any[]> {
    const injuries = await this.injuryModel.find().sort({ createdAt: -1 }).exec();
    return this.transformInjuries(injuries);
  }

  /**
   * Update medical status (Académie only)
   * Supports both numeric injuryId and playerId lookup
   */
  async updateStatus(
    injuryId: number | string,
    updateStatusDto: UpdateStatusDto,
  ): Promise<any> {
    let injury: InjuryDocument | null = null;

    // Try to parse as number (injuryId)
    const numericId = typeof injuryId === 'string' ? parseInt(injuryId, 10) : injuryId;
    
    if (!isNaN(numericId)) {
      // It's a numeric ID, search by injuryId
      injury = await this.findOne(numericId);
    } else {
      // It's not a number, assume it's a playerId and get the most recent injury
      const injuries = await this.injuryModel
        .find({ playerId: injuryId.toString() })
        .sort({ createdAt: -1 })
        .limit(1)
        .exec();
      
      if (injuries.length > 0) {
        injury = injuries[0];
      }
    }

    if (!injury) {
      throw new NotFoundException(
        `Injury not found. Si vous utilisez un playerId (ex: "user1"), assurez-vous que le joueur a déclaré au moins une blessure. Sinon, utilisez un ID de blessure valide (nombre).`,
      );
    }

    injury.status = updateStatusDto.status as MedicalStatus;
    const savedInjury = await injury.save();
    return this.transformInjury(savedInjury);
  }

  /**
   * Add recommendation (Académie only)
   * Supports both numeric injuryId and playerId lookup
   */
  async addRecommendation(
    injuryId: number | string,
    addRecommendationDto: AddRecommendationDto,
  ): Promise<InjuryDocument> {
    let injury: InjuryDocument | null = null;

    // Try to parse as number (injuryId)
    const numericId = typeof injuryId === 'string' ? parseInt(injuryId, 10) : injuryId;
    
    if (!isNaN(numericId)) {
      // It's a numeric ID, search by injuryId
      injury = await this.findOne(numericId);
    } else {
      // It's not a number, assume it's a playerId and get the most recent injury
      const injuries = await this.injuryModel
        .find({ playerId: injuryId.toString() })
        .sort({ createdAt: -1 })
        .limit(1)
        .exec();
      
      if (injuries.length > 0) {
        injury = injuries[0];
      }
    }

    if (!injury) {
      throw new NotFoundException(
        `Injury not found. Si vous utilisez un playerId (ex: "user1"), assurez-vous que le joueur a déclaré au moins une blessure. Sinon, utilisez un ID de blessure valide (nombre).`,
      );
    }

    injury.recommendations.push(addRecommendationDto.recommendation);
    return injury.save();
  }

  /**
   * Get all unavailable players (Arbitre only)
   * Returns all injuries with status "indisponible" OR "surveille"
   * This allows referees to see all injuries that need attention, not just unavailable ones
   */
  async getUnavailablePlayers(): Promise<any[]> {
    const injuries = await this.injuryModel
      .find({ 
        $or: [
          { status: MedicalStatus.INDISPONIBLE },
          { status: 'indisponible' },
          { status: MedicalStatus.SURVEILLE },
          { status: 'surveille' }
        ]
      })
      .sort({ createdAt: -1 })
      .exec();
    return this.transformInjuries(injuries);
  }

  /**
   * Debug method: Get all injuries grouped by status
   */
  async debugAllStatuses(): Promise<any> {
    const allInjuries = await this.injuryModel.find().sort({ createdAt: -1 }).exec();
    const transformed = this.transformInjuries(allInjuries);
    
    const grouped = {
      total: transformed.length,
      byStatus: {
        apte: transformed.filter((i: any) => i.status === 'apte' || i.status === MedicalStatus.APTE),
        surveille: transformed.filter((i: any) => i.status === 'surveille' || i.status === MedicalStatus.SURVEILLE),
        indisponible: transformed.filter((i: any) => i.status === 'indisponible' || i.status === MedicalStatus.INDISPONIBLE),
      },
      all: transformed,
    };
    
    return grouped;
  }

  /**
   * Notify academy admin when a player declares an injury
   * This is a placeholder - implement your notification system here
   */
  private async notifyAcademyAdmin(
    playerId: string,
    injury: InjuryDocument,
  ): Promise<void> {
    // TODO: Implement notification logic
    // Example: Send email, push notification, or store in notification table
    console.log(
      `[NOTIFICATION] Player ${playerId} declared a new injury: ${injury._id}`,
    );
  }
}

