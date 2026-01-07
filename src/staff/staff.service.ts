import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Staff, StaffDocument } from 'src/schemas/staff.schema';

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(Staff.name) private staffModel: Model<StaffDocument>,
  ) { }

  // ---------------- CREATE ----------------
  async create(createStaffDto: CreateStaffDto) {
    const staff = new this.staffModel(createStaffDto);
    return staff.save();
  }

  // ---------------- FIND ALL ----------------
  async findAll() {
    return this.staffModel.find().exec();
  }

  // ---------------- FIND ONE ----------------
  async findOne(id: string) {
    const staff = await this.staffModel.findById(id).exec();
    if (!staff) throw new NotFoundException('Staff introuvable');
    return staff;
  }

  // ---------------- UPDATE ----------------
  async update(id: string, updateStaffDto: UpdateStaffDto) {
    const staff = await this.staffModel.findByIdAndUpdate(id, updateStaffDto, {
      new: true,
    });
    if (!staff) throw new NotFoundException('Staff introuvable');
    return staff;
  }

  // ---------------- REMOVE ----------------
  async remove(id: string) {
    const result = await this.staffModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Staff introuvable');
    return { message: 'Staff supprimé avec succès', id };
  }

  async addArbitreToAcademie(idAcademie: string, idArbitre: string) {
    const academieObjectId = new Types.ObjectId(idAcademie);
    const arbitreObjectId = new Types.ObjectId(idArbitre);

    // Cherche le staff par id_academie
    let staff = await this.staffModel
      .findOne({ id_academie: academieObjectId })
      .exec();

    // Si aucun staff n'existe pour cette académie, on le crée et on y ajoute l'arbitre
    if (!staff) {
      staff = new this.staffModel({
        id_academie: academieObjectId,
        id_arbitres: [arbitreObjectId],
      });
      await staff.save();
      return staff;
    }

    // Sécurité: s'assurer que le tableau est initialisé
    if (!Array.isArray(staff.id_arbitres)) {
      staff.id_arbitres = [];
    }

    // Ajout sans doublon
    if (!staff.id_arbitres.some((a) => a.equals(arbitreObjectId))) {
      staff.id_arbitres.push(arbitreObjectId);
      await staff.save();
    }

    return staff;
  }

  // ---------------- FIND ARBITRES BY ACADEMIE ----------------
  async getArbitresByAcademie(idAcademie: string) {
    const academieObjectId = new Types.ObjectId(idAcademie);

    const staff = await this.staffModel
      .findOne({ id_academie: academieObjectId })
      .populate('id_arbitres')
      .exec();

    if (!staff) {
      throw new NotFoundException('Staff pour cette académie introuvable');
    }

    return staff.id_arbitres || [];
  }

  ////////////////////////delete arbitre from academie///////////////////////
  async removeArbitreFromAcademie(idAcademie: string, idArbitre: string) {
    const academieObjectId = new Types.ObjectId(idAcademie);
    const staff = await this.staffModel
      .findOne({ id_academie: academieObjectId })
      .exec();

    if (!staff) {
      throw new NotFoundException('Staff pour cette académie introuvable');
    }

    const arbitreObjectId = new Types.ObjectId(idArbitre);

    // Filtre : garde uniquement ceux qui ne sont pas égaux
    staff.id_arbitres = (staff.id_arbitres || []).filter(
      (a: Types.ObjectId) => !a.equals(arbitreObjectId)
    );

    await staff.save();

    return staff;
  }
  //check if arbitre exists in academie//
  async isArbitreInAcademie(
    idAcademie: string,
    idArbitre: string,
  ): Promise<boolean> {
    const staff = await this.staffModel
      .findOne({ id_academie: idAcademie })
      .exec();

    if (!staff) {
      throw new NotFoundException('Staff pour cette académie introuvable');
    }

    const arbitreObjectId = new Types.ObjectId(idArbitre);

    // Vérifie si l'arbitre existe dans la liste
    return staff.id_arbitres.some((a) => a.equals(arbitreObjectId));
  }
  //add coach to academie//
  async addCoachToAcademie(idAcademie: string, idCoach: string) {
    const academieObjectId = new Types.ObjectId(idAcademie);
    const coachObjectId = new Types.ObjectId(idCoach);

    // Chercher le staff pour cette académie
    let staff = await this.staffModel
      .findOne({ id_academie: academieObjectId })
      .exec();

    // Si aucun staff → créer un nouveau document
    if (!staff) {
      staff = new this.staffModel({
        id_academie: academieObjectId,
        id_coach: [coachObjectId],
      });
      await staff.save();
      return staff;
    }

    // Initialiser si null / non array (sécurité)
    if (!Array.isArray(staff.id_coach)) {
      staff.id_coach = [];
    }

    // Si le coach existe déjà → NE RIEN FAIRE
    if (staff.id_coach.some((c) => c.equals(coachObjectId))) {
      return "Coach Already exist"; // ⛔ Pas de save(), rien à modifier
    }

    // Ajouter le coach si nouveau
    staff.id_coach.push(coachObjectId);
    await staff.save();

    return staff;
  }

  //remove coach from academie//
  async removeCoachFromAcademie(idAcademie: string, idCoach: string) {
    const academieObjectId = new Types.ObjectId(idAcademie);
    const coachObjectId = new Types.ObjectId(idCoach);

    const staff = await this.staffModel
      .findOne({ id_academie: academieObjectId })
      .exec();

    if (!staff) {
      throw new NotFoundException('Staff pour cette académie introuvable');
    }

    staff.id_coach = staff.id_coach.filter(
      (c) => !c.equals(coachObjectId),
    );

    await staff.save();
    return staff;
  }

  //check if coach exists in academie//
  async isCoachInAcademie(
    idAcademie: string,
    idCoach: string,
  ): Promise<boolean> {
    const academieObjectId = new Types.ObjectId(idAcademie);
    const coachObjectId = new Types.ObjectId(idCoach);

    const staff = await this.staffModel
      .findOne({ id_academie: academieObjectId })
      .exec();

    if (!staff) {
      throw new NotFoundException('Staff pour cette académie introuvable');
    }

    return staff.id_coach.some((c) => c.equals(coachObjectId));
  }

  //get coaches by academie//
  // service
  async getCoachByAcademie(idAcademie: string) {
    const academieObjectId = new Types.ObjectId(idAcademie);

    const staff = await this.staffModel
      .findOne({ id_academie: academieObjectId })
      .populate('id_coach') // Popule les infos complètes des coachs depuis User
      .exec();

    if (!staff) {
      throw new NotFoundException('Staff pour cette académie introuvable');
    }

    return staff.id_coach || []; // Retourne un tableau vide si aucun coach
  }


}
