import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Request,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjuryService } from './injury.service';
import { CreateInjuryDto } from './dto/create-injury.dto';
import { AddEvolutionDto } from './dto/add-evolution.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AddRecommendationDto } from './dto/add-recommendation.dto';
import { RolesGuard, Roles, UserRole } from './guards/roles.guard';
import { PlayerOwnershipGuard } from './guards/player-ownership.guard';
import { TestUserInterceptor } from './interceptors/test-user.interceptor';

@ApiTags('Injury Management')
@Controller('injury')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class InjuryController {
  constructor(private readonly injuryService: InjuryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.JOUEUR)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Declare a new injury (Joueur only)',
    description:
      'Allows a player to declare a new injury. Automatically assigns the playerId and notifies the academy admin.',
  })
  @ApiBody({ type: CreateInjuryDto })
  @ApiResponse({
    status: 201,
    description: 'Injury declared successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Joueur role required' })
  async createInjury(
    @Body() createInjuryDto: CreateInjuryDto,
    @Request() req: any,
  ) {
    const playerId = req.user?.userId;
    if (!playerId) {
      throw new Error('User ID not found in request');
    }
    return this.injuryService.createInjury(playerId, createInjuryDto);
  }

  @Post(':injuryId/evolution')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.JOUEUR)
  @UseGuards(PlayerOwnershipGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Add daily evolution to an injury (Joueur only)',
    description:
      'Allows a player to add a daily update about their injury progress.',
  })
  @ApiParam({
    name: 'injuryId',
    description: 'ID numérique de la blessure (obtenez-le en créant d\'abord une blessure avec POST /api/v1/injury)',
    example: 1,
    type: Number,
  })
  @ApiBody({ type: AddEvolutionDto })
  @ApiResponse({
    status: 200,
    description: 'Evolution added successfully',
  })
  @ApiResponse({ status: 404, description: 'Injury not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your injury' })
  async addEvolution(
    @Param('injuryId') injuryId: string,
    @Body() addEvolutionDto: AddEvolutionDto,
  ) {
    const id = parseInt(injuryId, 10);
    if (isNaN(id)) {
      throw new NotFoundException(
        `Invalid injury ID: ${injuryId}. L'ID doit être un nombre.`,
      );
    }
    return this.injuryService.addEvolution(id, addEvolutionDto);
  }

  @Get('test/ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get test instructions',
    description:
      'Instructions pour obtenir des IDs de test. Créez d\'abord une blessure avec POST /api/injury.',
  })
  @ApiResponse({
    status: 200,
    description: 'Test instructions',
  })
  getTestIds() {
    return {
      message:
        'Créez d\'abord une blessure avec POST /api/injury pour obtenir un ID valide',
      steps: {
        step1: 'POST /api/injury → Créer une blessure',
        step2: 'Copier l\'_id de la réponse',
        step3: 'Utiliser cet ID dans POST /api/injury/{id}/evolution',
      },
      note: 'Les IDs sont générés automatiquement par MongoDB quand vous créez une blessure',
    };
  }

  @Get('my')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.JOUEUR)
  @ApiOperation({
    summary: 'Get own injury history (Joueur only)',
    description: 'Returns all injuries declared by the current player.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of injuries retrieved successfully',
  })
  async getMyInjuries(@Request() req: any) {
    const playerId = req.user?.userId;
    if (!playerId) {
      throw new Error('User ID not found in request');
    }
    return this.injuryService.getPlayerInjuries(playerId);
  }

  @Get('academy/:academyId')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ACADEMIE)
  @ApiOperation({
    summary: 'Get all injuries in academy (Académie only)',
    description:
      'Returns all injuries of all players belonging to the specified academy.',
  })
  @ApiParam({
    name: 'academyId',
    description: 'ID of the academy',
    example: 'academy123',
  })
  @ApiResponse({
    status: 200,
    description: 'List of injuries retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Académie role required' })
  async getAcademyInjuries(@Param('academyId') academyId: string) {
    return this.injuryService.getAcademyInjuries(academyId);
  }

  @Get('all')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ACADEMIE)
  @ApiOperation({
    summary: 'Get all injuries (Académie only)',
    description:
      'Returns all injuries of all players. Use this endpoint to get the list of injuries for the academy dashboard.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all injuries retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Académie role required' })
  async getAllInjuries() {
    return this.injuryService.getAllInjuries();
  }

  @Patch(':injuryId/status')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ACADEMIE)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Update medical status (Académie only)',
    description:
      'Allows academy to update the medical status of a player (Apte, À surveiller, Indisponible). You can use either an injury ID (ObjectId) or a playerId (ex: "user1") to update the most recent injury of that player.',
  })
  @ApiParam({
    name: 'injuryId',
    description: 'ID numérique de la blessure (ex: 1, 2, 3) ou playerId (ex: "user1") - si playerId est utilisé, la blessure la plus récente sera mise à jour',
    example: 1,
    type: Number,
  })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Injury not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Académie role required' })
  async updateStatus(
    @Param('injuryId') injuryId: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    // Try to parse as number, if fails, treat as playerId
    const id = parseInt(injuryId, 10);
    return this.injuryService.updateStatus(
      isNaN(id) ? injuryId : id,
      updateStatusDto,
    );
  }

  @Patch(':injuryId/recommendations')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ACADEMIE)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Add recommendation (Académie only)',
    description:
      'Allows academy to add medical recommendations for a player injury. You can use either an injury ID (ObjectId) or a playerId (ex: "user1") to add a recommendation to the most recent injury of that player.',
  })
  @ApiParam({
    name: 'injuryId',
    description: 'ID numérique de la blessure (ex: 1, 2, 3) ou playerId (ex: "user1") - si playerId est utilisé, la recommandation sera ajoutée à la blessure la plus récente',
    example: 1,
    type: Number,
  })
  @ApiBody({ type: AddRecommendationDto })
  @ApiResponse({
    status: 200,
    description: 'Recommendation added successfully',
  })
  @ApiResponse({ status: 404, description: 'Injury not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Académie role required' })
  async addRecommendation(
    @Param('injuryId') injuryId: string,
    @Body() addRecommendationDto: AddRecommendationDto,
  ) {
    // Try to parse as number, if fails, treat as playerId
    const id = parseInt(injuryId, 10);
    return this.injuryService.addRecommendation(
      isNaN(id) ? injuryId : id,
      addRecommendationDto,
    );
  }

  @Get('unavailable')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ARBITRE)
  @ApiOperation({
    summary: 'Get unavailable and monitored players (Arbitre only)',
    description:
      'Returns a list of all injuries with status "indisponible" (unavailable) OR "surveille" (monitored). This includes all injuries that need attention, including newly created injuries by players (which have status "surveille" by default).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of unavailable and monitored players retrieved successfully. Returns all injuries with status "indisponible" or "surveille".',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          playerId: { type: 'string' },
          type: { type: 'string' },
          severity: { type: 'string' },
          severityColor: { type: 'string', description: 'Color code for severity indicator' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['indisponible', 'surveille'] },
          date: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          evolutions: { type: 'array' },
          recommendations: { type: 'array' },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Arbitre role required' })
  async getUnavailablePlayers() {
    const injuries = await this.injuryService.getUnavailablePlayers();
    return injuries;
  }

  @Get('all-for-referee')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ARBITRE)
  @ApiOperation({
    summary: 'Get all injuries for referee (Arbitre only)',
    description:
      'Returns all injuries regardless of status. Useful for referees to see all player injuries, not just unavailable ones. Injuries are sorted by creation date (newest first).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all injuries retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          playerId: { type: 'string' },
          type: { type: 'string' },
          severity: { type: 'string' },
          severityColor: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['apte', 'surveille', 'indisponible'] },
          date: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          evolutions: { type: 'array' },
          recommendations: { type: 'array' },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Arbitre role required' })
  async getAllInjuriesForReferee() {
    return this.injuryService.getAllInjuries();
  }

  @Get('debug/all-statuses')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Debug: Get all injuries with their statuses (for testing)',
    description:
      'Returns all injuries grouped by status. Useful for debugging to see which injuries have which status. This endpoint is not protected by role guards for easier testing.',
  })
  @ApiResponse({
    status: 200,
    description: 'All injuries grouped by status',
  })
  async debugAllStatuses() {
    return this.injuryService.debugAllStatuses();
  }
}

