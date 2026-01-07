import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import { Equipe } from 'src/schemas/equipe.schema';
import { Match } from 'src/schemas/match.schema';
import * as mongoose from 'mongoose';

@Injectable()
export class UsersService {

  constructor(
    @InjectModel(User.name) private usermodel: Model<User>,
    @InjectModel(Equipe.name) private equipeModel: Model<Equipe>,
    @InjectModel(Match.name) private matchModel: Model<Match>,
  ) { }

  create(createUserDto: CreateUserDto) {
    const newUser = new this.usermodel(createUserDto);
    return newUser.save();
  }

  findAll() {
    return this.usermodel.find().exec();
  }

  findOne(id: string) {
    return this.usermodel.findById(id).exec();
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.usermodel
      .findByIdAndUpdate(id, updateUserDto, {
        new: true, // retourne l'utilisateur mis à jour
        runValidators: true, // applique les validateurs du schema
      })
      .exec();
  }

  remove(id: string) {
    return this.usermodel.findByIdAndDelete(id).exec();
  }

  // Rechercher des arbitres par nom, prénom ou email
  async searchArbitres(query: string) {
    const regex = new RegExp(query, 'i'); // 'i' = insensible à la casse
    return this.usermodel
      .find({
        role: 'ARBITRE',
        $or: [{ nom: regex }, { prenom: regex }, { email: regex }],
      })
      .exec();
  }

  // Rechercher des joueurs par nom, prénom ou email
  async searchJoueurs(query: string) {
    const regex = new RegExp(query, 'i'); // 'i' = insensible à la casse
    return this.usermodel
      .find({
        role: 'JOUEUR',
        $or: [{ nom: regex }, { prenom: regex }, { email: regex }],
      })
      .exec();
  }

  // Rechercher des coachs par nom, prénom ou email
  async searchCoach(query: string) {
    const regex = new RegExp(query, 'i'); // 'i' = insensible à la casse
    return this.usermodel
      .find({
        role: 'COACH',
        $or: [{ nom: regex }, { prenom: regex }, { email: regex }],
      })
      .exec();
  }

  // Rechercher des coachs et arbitres par nom, prénom ou email
  async searchCoachsArbitres(query: string) {
    const regex = new RegExp(query, 'i'); // insensible à la casse
    return this.usermodel
      .find({
        role: { $in: ['COACH', 'ARBITRE'] },
        $or: [{ nom: regex }, { prenom: regex }, { email: regex }],
      })
      .exec();
  }

  // Rechercher tous les utilisateurs par nom, prénom ou email (tous rôles)
  async searchAll(query: string) {
    const regex = new RegExp(query, 'i'); // insensible à la casse
    return this.usermodel
      .find({
        $or: [{ nom: regex }, { prenom: regex }, { email: regex }],
      })
      .exec();
  }

  // Obtenir les statistiques de profil selon le rôle
  async getProfileStats(userId: string) {
    const user = await this.usermodel.findById(userId).exec();
    if (!user) {
      throw new Error('User not found');
    }

    const role = user['role']; // Utiliser bracket notation au cas où

    switch (role) {
      case 'OWNER':
        return this.getOwnerStats(userId);
      case 'JOUEUR':
        return this.getPlayerStats(userId);
      case 'ARBITRE':
        return this.getRefereeStats(userId);
      case 'COACH':
        return this.getCoachStats(userId);
      default:
        return { error: 'Unknown role' };
    }
  }

  // Stats pour OWNER
  private async getOwnerStats(userId: string) {
    let userObjectId: mongoose.Types.ObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (e) {
      return { role: 'OWNER', wins: 0, losses: 0, totalMatches: 0, winRate: '0%', totalPlayers: 0, trophies: 0, recentMatches: [] };
    }

    const teams = await this.equipeModel.find({ id_academie: userObjectId }).exec();
    const teamIds = teams.map(t => t._id.toString());
    const teamObjectIds = teams.map(t => t._id);
    const searchIds = [...teamIds, userId];
    const searchObjectIds = [...teamObjectIds, userObjectId];

    const matches = await this.matchModel.find({
      statut: { $in: ['TERMINE', 'TERMINEE'] },
      $or: [
        { id_equipe1: { $in: searchObjectIds } },
        { id_equipe2: { $in: searchObjectIds } }
      ]
    }).sort({ date: -1 }).exec();

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let trophies = 0;
    let totalPlayers = 0;

    for (const team of teams) {
      totalPlayers += team.members?.length || 0;
    }

    const recentMatches: any[] = [];
    for (const match of matches) {
      const m = match.toObject() as any;
      const id1 = m.id_equipe1 ? m.id_equipe1.toString() : null;
      const id2 = m.id_equipe2 ? m.id_equipe2.toString() : null;

      const isTeam1 = id1 && searchIds.includes(id1);
      const isTeam2 = id2 && searchIds.includes(id2);

      let status = "D";
      const s1 = Number(m.score_eq1 || 0);
      const s2 = Number(m.score_eq2 || 0);

      const isFinal = Number(m.round) === 3;
      if (isTeam1) {
        if (s1 > s2) {
          wins++;
          status = "W";
          if (isFinal) trophies++;
        }
        else if (s1 < s2) { losses++; status = "L"; }
        else draws++;
      } else if (isTeam2) {
        if (s2 > s1) {
          wins++;
          status = "W";
          if (isFinal) trophies++;
        }
        else if (s2 < s1) { losses++; status = "L"; }
        else draws++;
      }

      if (recentMatches.length < 5) {
        recentMatches.push({
          id: m._id.toString(),
          status,
          title: "Match",
          date: m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
          score: `${s1}-${s2}`
        });
      }
    }

    const totalMatches = wins + losses + draws;
    const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : '0.0';

    return {
      role: 'OWNER',
      wins,
      losses,
      totalMatches,
      winRate: `${winRate}%`,
      totalPlayers,
      trophies,
      recentMatches
    };
  }

  // Stats pour JOUEUR
  private async getPlayerStats(userId: string) {
    const team = await this.equipeModel.findOne({ members: userId })
      .populate('id_academie')
      .exec();

    const matches = await this.matchModel.find({
      statut: { $in: ['TERMINE', 'TERMINEE'] },
      $or: [
        { id_equipe1: team?._id },
        { id_equipe2: team?._id }
      ]
    }).sort({ date: -1 }).exec();

    const matchesPlayed = matches.length;
    const recentMatches: any[] = [];
    for (const match of matches) {
      const m = match.toObject() as any;
      const isTeam1 = m.id_equipe1?.toString() === team?._id.toString();
      let status = "D";
      const s1 = Number(m.score_eq1 || 0);
      const s2 = Number(m.score_eq2 || 0);
      if (isTeam1) {
        if (s1 > s2) status = "W";
        else if (s1 < s2) status = "L";
      } else {
        if (s2 > s1) status = "W";
        else if (s2 < s1) status = "L";
      }
      if (recentMatches.length < 5) {
        recentMatches.push({
          id: m._id.toString(),
          status,
          title: "Match",
          date: m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
          score: `${s1}-${s2}`
        });
      }
    }

    // Compter les goals
    const goalsCount = await this.matchModel.aggregate([
      {
        $match: {
          $or: [
            { But_eq1: new mongoose.Types.ObjectId(userId) },
            { But_eq2: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $project: {
          goals: {
            $add: [
              { $size: { $ifNull: [{ $filter: { input: '$But_eq1', cond: { $eq: ['$$this', new mongoose.Types.ObjectId(userId)] } } }, []] } },
              { $size: { $ifNull: [{ $filter: { input: '$But_eq2', cond: { $eq: ['$$this', new mongoose.Types.ObjectId(userId)] } } }, []] } }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalGoals: { $sum: '$goals' }
        }
      }
    ]).exec();

    // Compter les assists
    const assistsCount = await this.matchModel.aggregate([
      {
        $match: {
          $or: [
            { assist_eq1: new mongoose.Types.ObjectId(userId) },
            { assist_eq2: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $project: {
          assists: {
            $add: [
              { $size: { $ifNull: [{ $filter: { input: '$assist_eq1', cond: { $eq: ['$$this', new mongoose.Types.ObjectId(userId)] } } }, []] } },
              { $size: { $ifNull: [{ $filter: { input: '$assist_eq2', cond: { $eq: ['$$this', new mongoose.Types.ObjectId(userId)] } } }, []] } }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalAssists: { $sum: '$assists' }
        }
      }
    ]).exec();

    let academyName = 'Independent';
    if (team && team.id_academie) {
      const owner = team.id_academie as any;
      if (owner.nom && owner.prenom) {
        academyName = `${owner.prenom} ${owner.nom}`;
      }
    }

    return {
      role: 'JOUEUR',
      teamName: team?.nom || 'No team',
      academyName: academyName,
      matchesPlayed: matchesPlayed,
      goals: goalsCount.length > 0 ? goalsCount[0].totalGoals : 0,
      assists: assistsCount.length > 0 ? assistsCount[0].totalAssists : 0,
      recentMatches
    };
  }

  // Stats pour ARBITRE
  private async getRefereeStats(userId: string) {
    const matches = await this.matchModel.find({
      id_arbitre: userId,
      statut: { $in: ['TERMINE', 'TERMINEE'] }
    }).sort({ date: -1 }).exec();

    const matchesRefereed = matches.length;
    const recentMatches: any[] = [];
    for (const m of matches) {
      const matchObj = m.toObject() as any;
      if (recentMatches.length < 5) {
        recentMatches.push({
          id: matchObj._id.toString(),
          status: "D", // Neutral for referee
          title: "Match",
          date: matchObj.date ? new Date(matchObj.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
          score: `${matchObj.score_eq1}-${matchObj.score_eq2}`
        });
      }
    }

    const team = await this.equipeModel.findOne({ members: userId }).exec();

    return {
      role: 'ARBITRE',
      matchesRefereed: matchesRefereed,
      academyName: team?.nom || 'Independent',
      recentMatches
    };
  }

  // Stats pour COACH
  private async getCoachStats(userId: string) {
    const team = await this.equipeModel.findOne({ members: userId }).exec();

    const matches = await this.matchModel.find({
      $or: [
        { id_equipe1: team?._id },
        { id_equipe2: team?._id }
      ],
      statut: { $in: ['TERMINE', 'TERMINEE'] }
    }).sort({ date: -1 }).exec();

    const matchesCoached = matches.length;
    let wins = 0;
    let losses = 0;
    const recentMatches: any[] = [];

    for (const m of matches) {
      const matchObj = m.toObject() as any;
      const isTeam1 = matchObj.id_equipe1?.toString() === team?._id.toString();
      let status = "D";
      const s1 = Number(matchObj.score_eq1 || 0);
      const s2 = Number(matchObj.score_eq2 || 0);
      if (isTeam1) {
        if (s1 > s2) { wins++; status = "W"; }
        else if (s1 < s2) { losses++; status = "L"; }
      } else {
        if (s2 > s1) { wins++; status = "W"; }
        else if (s2 < s1) { losses++; status = "L"; }
      }

      if (recentMatches.length < 5) {
        recentMatches.push({
          id: matchObj._id.toString(),
          status,
          title: "Match",
          date: matchObj.date ? new Date(matchObj.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
          score: `${s1}-${s2}`
        });
      }
    }

    return {
      role: 'COACH',
      teamName: team?.nom || 'No team',
      matchesCoached: matchesCoached,
      teamWins: wins,
      teamLosses: losses,
      recentMatches
    };
  }

  async getNames(ids: string[]) {
    const results: Record<string, string> = {};
    for (const id of ids) {
      if (!id) continue;
      try {
        // Try Equipe
        const equipe = await this.equipeModel.findById(id).populate('id_academie').exec();
        if (equipe && equipe.id_academie) {
          results[id] = `${(equipe.id_academie as any).prenom || ''} ${(equipe.id_academie as any).nom || ''}`.trim() || equipe.nom;
          continue;
        } else if (equipe) {
          results[id] = equipe.nom;
          continue;
        }
        // Try User
        const user = await this.usermodel.findById(id).exec();
        if (user) {
          const u = user as any;
          results[id] = `${u.prenom || ''} ${u.nom || ''}`.trim();
        }
      } catch (e) {
        // Ignore invalid IDs
      }
    }
    return results;
  }
}

