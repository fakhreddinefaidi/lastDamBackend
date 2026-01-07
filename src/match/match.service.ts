// src/match/match.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Match, Statut } from 'src/schemas/match.schema';
import { Equipe } from 'src/schemas/equipe.schema';
import { User } from 'src/schemas/user.schemas';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';

@Injectable()
export class MatchService {
  constructor(
    @InjectModel(Match.name) private matchModel: Model<Match>,
    @InjectModel(Equipe.name) private equipeModel: Model<Equipe>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) { }

  // **C**REATE
  async create(createMatchDto: CreateMatchDto): Promise<Match> {
    if (createMatchDto.id_equipe1 === createMatchDto.id_equipe2) {
      throw new BadRequestException(
        'Une équipe ne peut pas jouer contre elle-même.',
      );
    }
    const newMatch = new this.matchModel(createMatchDto);
    return newMatch.save();
  }

  // **R**EAD ALL
  private async resolveTeamName(idOrObj: any): Promise<any> {
    if (!idOrObj) return null;

    // Extract ID
    const id = typeof idOrObj === 'string' ? idOrObj : (idOrObj._id ? idOrObj._id.toString() : idOrObj.toString());

    // Try to find as Equipe first
    const equipe = await this.equipeModel.findById(id).populate({
      path: 'id_academie',
      select: 'nom prenom picture'
    }).exec();

    if (equipe) {
      const e = equipe.toObject() as any;
      if (e.id_academie) {
        return {
          _id: e._id.toString(),
          nom: `${e.id_academie.prenom || ''} ${e.id_academie.nom || ''}`.trim() || e.nom,
          logo: e.logo || e.id_academie.picture
        };
      }
      return {
        _id: e._id.toString(),
        nom: e.nom,
        logo: e.logo
      };
    }

    // Try to find as User (Academy)
    const user = await this.userModel.findById(id).select('nom prenom picture').exec();
    if (user) {
      const u = user.toObject() as any;
      return {
        _id: u._id.toString(),
        nom: `${u.prenom || ''} ${u.nom || ''}`.trim(),
        logo: u.picture
      };
    }

    // Fallback
    return typeof idOrObj === 'string' ? { _id: idOrObj, nom: 'Unknown' } : idOrObj;
  }

  async findAll(): Promise<any[]> {
    const matches = await this.matchModel
      .find()
      .populate('id_terrain', 'localisation name')
      .populate('id_arbitre', 'nom prenom')
      .exec();

    const results: any[] = [];
    for (const match of matches) {
      const m = match.toObject() as any;
      m._id = m._id.toString();
      m.id_equipe1 = await this.resolveTeamName(m.id_equipe1);
      m.id_equipe2 = await this.resolveTeamName(m.id_equipe2);
      results.push(m);
    }
    return results;
  }

  // **R**EAD ONE
  async findOne(id: string): Promise<any | null> {
    const match = await this.matchModel
      .findById(id)
      .populate('id_terrain', 'localisation name')
      .populate('id_arbitre', 'nom prenom')
      .populate('cartonJaune', 'nom prenom')
      .populate('cartonRouge', 'nom prenom')
      .populate('But_eq1', 'nom prenom')
      .populate('But_eq2', 'nom prenom')
      .populate('assist_eq1', 'nom prenom')
      .populate('assist_eq2', 'nom prenom')
      .populate('offside_eq1', 'nom prenom')
      .populate('offside_eq2', 'nom prenom')
      .exec();

    if (!match) return null;

    const m = match.toObject() as any;
    // Ensure _id is a string
    if (m._id) m._id = m._id.toString();

    m.id_equipe1 = await this.resolveTeamName(m.id_equipe1);
    m.id_equipe2 = await this.resolveTeamName(m.id_equipe2);

    return m;
  }

  // **U**PDATE (Finish + Stats + Qualification)
  async update(
    id: string,
    updateMatchDto: UpdateMatchDto,
  ): Promise<Match | null> {
    const existingMatch = await this.matchModel.findById(id).exec();
    if (!existingMatch) return null;

    const willFinish =
      updateMatchDto.statut === Statut.TERMINE &&
      existingMatch.statut !== Statut.TERMINE;

    const hasScores =
      updateMatchDto.score_eq1 !== undefined &&
      updateMatchDto.score_eq2 !== undefined;

    if (willFinish && !hasScores) {
      throw new BadRequestException(
        'Les scores sont obligatoires pour terminer le match.',
      );
    }

    // Update match
    const updatedMatch = await this.matchModel
      .findByIdAndUpdate(id, updateMatchDto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (updatedMatch && willFinish) {
      await this.updateTeamStats(updatedMatch);
      await this.qualifyWinner(updatedMatch);
    }

    return updatedMatch;
  }

  // **QUALIFY WINNER**
  private async qualifyWinner(match: Match): Promise<void> {
    if (!match.nextMatch) return; // Last match → no qualification

    let winner: Types.ObjectId;

    const { score_eq1, score_eq2, id_equipe1, id_equipe2 } = match;

    if (score_eq1 > score_eq2) winner = id_equipe1 as any;
    else if (score_eq2 > score_eq1) winner = id_equipe2 as any;
    else return; // Match nul (ne devrait pas exister en élimination)

    const nextMatch = await this.matchModel.findById(match.nextMatch).exec();
    if (!nextMatch) return;

    if (match.positionInNextMatch === 'eq1') {
      nextMatch.id_equipe1 = winner;
    } else if (match.positionInNextMatch === 'eq2') {
      nextMatch.id_equipe2 = winner;
    }

    await nextMatch.save();
  }

  // **UPDATE TEAM STATS**
  private async updateTeamStats(match: Match): Promise<void> {
    const { id_equipe1, id_equipe2, score_eq1, score_eq2 } = match;

    const stats1 = this.calculateStatsUpdate(score_eq1, score_eq2);
    const stats2 = this.calculateStatsUpdate(score_eq2, score_eq1);

    await this.equipeModel.findByIdAndUpdate(id_equipe1, {
      $inc: {
        'stats.nbrMatchJoue': 1,
        'stats.matchWin': stats1.matchWin,
        'stats.matchDraw': stats1.matchDraw,
        'stats.matchLoose': stats1.matchLoose,
        'stats.nbrButMarques': score_eq1,
        'stats.nbrButEncaisse': score_eq2,
      },
    });

    await this.equipeModel.findByIdAndUpdate(id_equipe2, {
      $inc: {
        'stats.nbrMatchJoue': 1,
        'stats.matchWin': stats2.matchWin,
        'stats.matchDraw': stats2.matchDraw,
        'stats.matchLoose': stats2.matchLoose,
        'stats.nbrButMarques': score_eq2,
        'stats.nbrButEncaisse': score_eq1,
      },
    });
  }

  // **HELPER**
  private calculateStatsUpdate(score1: number, score2: number) {
    if (score1 > score2) return { matchWin: 1, matchDraw: 0, matchLoose: 0 };
    if (score1 < score2) return { matchWin: 0, matchDraw: 0, matchLoose: 1 };
    return { matchWin: 0, matchDraw: 1, matchLoose: 0 };
  }

  // **DELETE**
  remove(id: string): Promise<any> {
    return this.matchModel.findByIdAndDelete(id).exec();
  }

  // ===== MATCH STATISTICS MANAGEMENT ===== //

  async getScorersByAcademie(
    matchId: string,
    idAcademie: string,
  ): Promise<User[]> {
    const match = await this.matchModel.findById(matchId).exec();
    if (!match)
      throw new NotFoundException(`Match avec ID ${matchId} introuvable`);

    const allButs = [...(match.But_eq1 ?? []), ...(match.But_eq2 ?? [])];
    const butIds = Array.from(new Set(allButs.map((id: any) => id.toString())));

    if (butIds.length === 0) return [] as any;

    const joueurs = await this.userModel
      .find({ _id: { $in: butIds } })
      .select('-password -verificationCode -codeExpiresAt')
      .exec();

    return joueurs as any;
  }

  async getCardsByAcademie(
    matchId: string,
    idAcademie: string,
    color: 'yellow' | 'red',
  ): Promise<User[]> {
    const match = await this.matchModel.findById(matchId).exec();
    if (!match)
      throw new NotFoundException(`Match avec ID ${matchId} introuvable`);

    const normalized = (color ?? '').toLowerCase();
    if (normalized !== 'yellow' && normalized !== 'red') {
      throw new BadRequestException(
        `Couleur invalide: ${color}. Utiliser 'yellow' ou 'red'.`,
      );
    }

    const list =
      normalized === 'yellow'
        ? match.cartonJaune ?? []
        : match.cartonRouge ?? [];
    const userIds = Array.from(new Set(list.map((id: any) => id.toString())));

    if (userIds.length === 0) return [] as any;

    const joueurs = await this.userModel
      .find({ _id: { $in: userIds } })
      .select('-password -verificationCode -codeExpiresAt')
      .exec();

    return joueurs as any;
  }

  async addCartonToMatch(
    matchId: string,
    idJoueur: string,
    categorie: string,
    color: 'yellow' | 'red',
  ): Promise<Match> {
    const match = await this.matchModel.findById(matchId).exec();
    if (!match)
      throw new NotFoundException(`Match avec ID ${matchId} introuvable`);

    const equipe = await this.equipeModel.findOne({ categorie }).exec();
    if (!equipe) {
      throw new NotFoundException(
        `Aucune équipe trouvée pour la catégorie ${categorie}`,
      );
    }

    const joueurObjectId = new Types.ObjectId(idJoueur);

    // Vérifier si le joueur est dans starters ou substitutes
    const allPlayers = [
      ...(equipe.starters ?? []),
      ...(equipe.substitutes ?? []),
    ];

    const joueurValide = allPlayers.some((m: any) =>
      m.toString() === idJoueur,
    );

    if (!joueurValide) {
      throw new BadRequestException(
        `Le joueur ${idJoueur} n'appartient pas à cette équipe (${categorie}).`,
      );
    }

    const normalized = color?.toLowerCase();
    if (normalized !== 'yellow' && normalized !== 'red') {
      throw new BadRequestException(
        `Couleur invalide: ${color}. Utiliser 'yellow' ou 'red'.`,
      );
    }

    if (normalized === 'yellow') {
      if (!Array.isArray(match.cartonJaune)) match.cartonJaune = [];

      const exists = match.cartonJaune.some(
        (m: any) => m.toString() === idJoueur,
      );

      if (!exists) match.cartonJaune.push(joueurObjectId as any);
    } else {
      if (!Array.isArray(match.cartonRouge)) match.cartonRouge = [];

      const exists = match.cartonRouge.some(
        (m: any) => m.toString() === idJoueur,
      );

      if (!exists) match.cartonRouge.push(joueurObjectId as any);
    }

    await match.save();
    return match;
  }

  async addStatToMatch(
    matchId: string,
    idJoueur: string,
    equipeNumber: 'eq1' | 'eq2',
    type: 'but' | 'assist',
  ): Promise<Match> {
    const match = await this.matchModel.findById(matchId).exec();
    if (!match)
      throw new NotFoundException(`Match avec ID ${matchId} introuvable`);

    const joueurObjectId = new Types.ObjectId(idJoueur);

    let targetField: string;

    if (type === 'but') {
      targetField = equipeNumber === 'eq1' ? 'But_eq1' : 'But_eq2';
    } else if (type === 'assist') {
      targetField = equipeNumber === 'eq1' ? 'assist_eq1' : 'assist_eq2';
    } else {
      throw new BadRequestException(`Type invalide: ${type}`);
    }

    if (!Array.isArray(match[targetField])) match[targetField] = [];
    match[targetField].push(joueurObjectId as any);

    await match.save();
    return match;
  }

  async incrementCorner(matchId: string, idAcademie: string): Promise<Match> {
    const match = await this.matchModel.findById(matchId).exec();
    if (!match)
      throw new NotFoundException(`Match avec ID ${matchId} introuvable`);

    const acadId = new Types.ObjectId(idAcademie);

    if (match.id_equipe1?.equals(acadId)) {
      match.corner_eq1 = (match.corner_eq1 ?? 0) + 1;
    } else if (match.id_equipe2?.equals(acadId)) {
      match.corner_eq2 = (match.corner_eq2 ?? 0) + 1;
    } else {
      throw new BadRequestException(
        `Cette académie ne correspond à aucune équipe dans le match.`,
      );
    }

    await match.save();
    return match;
  }

  async incrementPenalty(matchId: string, idAcademie: string): Promise<Match> {
    const match = await this.matchModel.findById(matchId).exec();
    if (!match)
      throw new NotFoundException(`Match avec ID ${matchId} introuvable`);

    const acadId = new Types.ObjectId(idAcademie);

    if (match.id_equipe1?.equals(acadId)) {
      match.penalty_eq1 = (match.penalty_eq1 ?? 0) + 1;
    } else if (match.id_equipe2?.equals(acadId)) {
      match.penalty_eq2 = (match.penalty_eq2 ?? 0) + 1;
    } else {
      throw new BadRequestException(
        `Cette académie ne correspond à aucune équipe dans le match.`,
      );
    }

    await match.save();
    return match;
  }

  async addOffside(
    matchId: string,
    idJoueur: string,
    idAcademie: string,
  ): Promise<Match> {
    const match = await this.matchModel.findById(matchId).exec();
    if (!match)
      throw new NotFoundException(`Match avec ID ${matchId} introuvable`);

    const acadId = new Types.ObjectId(idAcademie);
    const joueurId = new Types.ObjectId(idJoueur);

    const isEq1 = match.id_equipe1?.equals(acadId);
    const isEq2 = match.id_equipe2?.equals(acadId);

    if (!isEq1 && !isEq2) {
      throw new BadRequestException(
        `L'académie ne correspond à aucune équipe dans ce match.`,
      );
    }

    if (isEq1) {
      if (!Array.isArray(match.offside_eq1)) match.offside_eq1 = [];
      match.offside_eq1.push(joueurId as any);
    } else if (isEq2) {
      if (!Array.isArray(match.offside_eq2)) match.offside_eq2 = [];
      match.offside_eq2.push(joueurId as any);
    }

    await match.save();
    return match;
  }
}
