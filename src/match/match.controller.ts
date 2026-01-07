// src/match/match.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MatchService } from './match.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guards';
import { Roles } from 'src/auth/decorators/role.decorators';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Statut } from 'src/schemas/match.schema';

@ApiTags('Matches')
@ApiBearerAuth('access-token')
@Controller('matches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatchController {
  constructor(private readonly matchService: MatchService) { }

  // POST /matches: Only OWNER can schedule a match
  @Post()
  @Roles('OWNER')
  @ApiOperation({
    summary: 'Créer/programmer un nouveau match (OWNER uniquement)',
  })
  @ApiResponse({ status: 201, description: 'Match créé avec succès.' })
  create(@Body() createMatchDto: CreateMatchDto) {
    return this.matchService.create(createMatchDto);
  }

  // GET /matches: All roles can view the schedule
  @Get()
  @Roles('JOUEUR', 'OWNER', 'ARBITRE')
  @ApiOperation({ summary: 'Afficher la liste de tous les matchs' })
  @ApiResponse({ status: 200, description: 'Liste des matchs récupérée.' })
  findAll() {
    return this.matchService.findAll();
  }

  // GET /matches/:id
  @Get(':id')
  @Roles('JOUEUR', 'OWNER', 'ARBITRE')
  @ApiOperation({ summary: "Afficher les détails d'un match par ID" })
  @ApiParam({ name: 'id', description: 'ID du match' })
  findOne(@Param('id') id: string) {
    return this.matchService.findOne(id);
  }

  // PATCH /matches/:id: Restricted to OWNER (for rescheduling) and ARBITRE (for status/score updates)
  @Patch(':id')
  @Roles('OWNER', 'ARBITRE')
  @ApiOperation({
    summary:
      'Modifier un match (OWNER pour les détails, ARBITRE pour le statut/score)',
  })
  async update(
    @Param('id') id: string,
    @Body() updateMatchDto: UpdateMatchDto,
    @Req() req: any,
  ) {
    const match = await this.matchService.findOne(id);
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found.`);
    }

    // ARBITRE can only update score and status, and only for the match they are assigned to
    if (userRole === 'ARBITRE') {
      // Prevent Arbitre from changing other fields
      const allowedArbitreUpdates = ['score_eq1', 'score_eq2', 'statut'];

      for (const key of Object.keys(updateMatchDto)) {
        if (!allowedArbitreUpdates.includes(key)) {
          throw new ForbiddenException(
            `L'arbitre n'est autorisé à modifier que le statut et les scores.`,
          );
        }
      }
    }

    // OWNER can update everything, no further checks needed for them here.

    return this.matchService.update(id, updateMatchDto);
  }

  // DELETE /matches/:id: Only OWNER can delete
  @Delete(':id')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Supprimer un match (OWNER uniquement)' })
  @ApiResponse({ status: 200, description: 'Match supprimé avec succès.' })
  remove(@Param('id') id: string) {
    return this.matchService.remove(id);
  }

  // ===== MATCH STATISTICS ENDPOINTS ===== //

  @Get(':matchId/scorers/:idAcademie')
  @Roles('JOUEUR', 'OWNER', 'ARBITRE')
  @ApiOperation({ summary: 'Afficher les joueurs ayant marqué dans ce match' })
  @ApiParam({ name: 'matchId', description: 'ID du match' })
  @ApiParam({
    name: 'idAcademie',
    description: "Param ignoré (compatibilité): ID d'équipe",
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des buteurs (infos utilisateur sans champs sensibles).',
  })
  @ApiResponse({ status: 404, description: 'Match ou équipe introuvable.' })
  @ApiResponse({
    status: 400,
    description: "L'équipe ne correspond pas au match.",
  })
  async getScorersByAcademie(
    @Param('matchId') matchId: string,
    @Param('idAcademie') idAcademie: string,
  ) {
    return this.matchService.getScorersByAcademie(matchId, idAcademie);
  }

  @Get(':matchId/cards/:idAcademie/:color')
  @Roles('JOUEUR', 'OWNER', 'ARBITRE')
  @ApiOperation({
    summary:
      "Afficher les joueurs ayant reçu un carton (yellow/red) dans ce match",
  })
  @ApiParam({ name: 'matchId', description: 'ID du match' })
  @ApiParam({
    name: 'idAcademie',
    description: "Param ignoré (compatibilité): ID d'équipe",
  })
  @ApiParam({
    name: 'color',
    description: "Couleur du carton ('yellow' ou 'red')",
  })
  @ApiResponse({ status: 200, description: 'Liste des joueurs sanctionnés.' })
  @ApiResponse({ status: 404, description: 'Match introuvable.' })
  @ApiResponse({ status: 400, description: 'Couleur invalide.' })
  async getCardsByAcademie(
    @Param('matchId') matchId: string,
    @Param('idAcademie') idAcademie: string,
    @Param('color') color: 'yellow' | 'red',
  ) {
    return this.matchService.getCardsByAcademie(matchId, idAcademie, color);
  }

  @Post(':matchId/carton')
  @ApiOperation({
    summary: 'Ajouter un carton à un joueur',
    description:
      "Ajoute un carton jaune ou rouge à un joueur dans un match. Le joueur doit appartenir à l'équipe (titulaires ou remplaçants).",
  })
  @ApiParam({
    name: 'matchId',
    required: true,
    description: 'ID du match',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        idJoueur: {
          type: 'string',
          example: '675abc12ef98a01ddc33bcf1',
        },
        categorie: {
          type: 'string',
          example: 'SENIOR',
        },
        color: {
          type: 'string',
          enum: ['yellow', 'red'],
          example: 'yellow',
        },
      },
      required: ['idJoueur', 'categorie', 'color'],
    },
  })
  async addCartonToMatch(
    @Param('matchId') matchId: string,
    @Body('idJoueur') idJoueur: string,
    @Body('categorie') categorie: string,
    @Body('color') color: 'yellow' | 'red',
  ) {
    return this.matchService.addCartonToMatch(
      matchId,
      idJoueur,
      categorie,
      color,
    );
  }

  @Post(':matchId/stat')
  @ApiOperation({
    summary: 'Ajouter un but ou un assist à un joueur',
    description:
      'ARBITRE et OWNER peuvent ajouter un but ou un assist pour une équipe (eq1 ou eq2).',
  })
  @ApiParam({ name: 'matchId', required: true, description: 'ID du match' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        idJoueur: { type: 'string', example: '670fa1c2bc90c842599a0021' },
        equipe: { type: 'string', enum: ['eq1', 'eq2'], example: 'eq1' },
        type: { type: 'string', enum: ['but', 'assist'], example: 'but' },
      },
      required: ['idJoueur', 'equipe', 'type'],
    },
  })
  async addStatToMatch(
    @Param('matchId') matchId: string,
    @Body('idJoueur') idJoueur: string,
    @Body('equipe') equipe: 'eq1' | 'eq2',
    @Body('type') type: 'but' | 'assist',
  ) {
    return this.matchService.addStatToMatch(matchId, idJoueur, equipe, type);
  }

  @Patch('corner/:matchId/:idAcademie')
  @ApiOperation({
    summary: 'Incrémenter +1 corner pour une équipe (eq1 ou eq2)',
  })
  @ApiParam({ name: 'matchId', description: 'ID du match' })
  @ApiParam({
    name: 'idAcademie',
    description: "ID de l'équipe qui a obtenu le corner (eq1 ou eq2)",
  })
  @ApiResponse({ status: 200, description: 'Corner incrémenté avec succès.' })
  @ApiResponse({ status: 404, description: 'Match introuvable.' })
  @ApiResponse({
    status: 400,
    description: "L'équipe ne correspond pas au match.",
  })
  async incrementCorner(
    @Param('matchId') matchId: string,
    @Param('idAcademie') idAcademie: string,
  ) {
    return this.matchService.incrementCorner(matchId, idAcademie);
  }

  @Patch('penalty/:matchId/:idAcademie')
  @ApiOperation({
    summary: 'Incrémenter +1 penalty pour une équipe (eq1 ou eq2)',
  })
  @ApiParam({ name: 'matchId', description: 'ID du match' })
  @ApiParam({
    name: 'idAcademie',
    description: "ID de l'équipe qui a obtenu le penalty (eq1 ou eq2)",
  })
  @ApiResponse({ status: 200, description: 'Penalty incrémenté avec succès.' })
  @ApiResponse({ status: 404, description: 'Match introuvable.' })
  @ApiResponse({
    status: 400,
    description: "L'équipe ne correspond pas au match.",
  })
  async incrementPenalty(
    @Param('matchId') matchId: string,
    @Param('idAcademie') idAcademie: string,
  ) {
    return this.matchService.incrementPenalty(matchId, idAcademie);
  }

  @Post('add-offside/:matchId/:idAcademie/:idJoueur')
  @ApiOperation({
    summary: 'Ajouter un hors-jeu (offside) pour un joueur dans un match.',
  })
  @ApiParam({
    name: 'matchId',
    description: 'ID du match',
    type: String,
  })
  @ApiParam({
    name: 'idAcademie',
    description: 'Académie du joueur (détermine eq1 ou eq2)',
    type: String,
  })
  @ApiParam({
    name: 'idJoueur',
    description: 'ID du joueur à ajouter dans la liste des offsides',
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: 'Offside ajouté avec succès. Retourne le match mis à jour.',
  })
  @ApiResponse({ status: 404, description: 'Match non trouvé.' })
  @ApiResponse({
    status: 400,
    description: 'Académie ne correspond à aucune équipe du match.',
  })
  async addOffside(
    @Param('matchId') matchId: string,
    @Param('idAcademie') idAcademie: string,
    @Param('idJoueur') idJoueur: string,
  ) {
    return this.matchService.addOffside(matchId, idJoueur, idAcademie);
  }
}