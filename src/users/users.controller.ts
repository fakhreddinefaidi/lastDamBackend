import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { User } from './entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // ---------------- Recherche COACH et ARBITRES----------------
  @Get('search/coachs-arbitres')
  @ApiOperation({
    summary: 'Recherche des coachs et arbitres par nom, prénom ou email',
  })
  @ApiQuery({ name: 'q', type: String, description: 'Texte de recherche' })
  @ApiResponse({
    status: 200,
    description: 'Liste des coachs et arbitres trouvés',
    type: [User],
  })
  @ApiResponse({ status: 404, description: 'Aucun utilisateur trouvé' })
  async searchCoachsArbitres(@Query('q') query: string): Promise<User[]> {
    if (!query) {
      throw new NotFoundException('Veuillez fournir un texte de recherche');
    }

    const results = await this.usersService.searchCoachsArbitres(query);

    if (!results || results.length === 0) {
      throw new NotFoundException('Aucun coach ou arbitre trouvé');
    }

    return results;
  }

  // ---------------- Recherche TOUS LES UTILISATEURS ----------------
  @Get('search/all')
  @ApiOperation({ summary: 'Rechercher des utilisateurs (tous rôles) par nom, prénom ou email' })
  @ApiQuery({ name: 'q', type: String, description: 'Texte de recherche' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs correspondants.', type: [User] })
  @ApiResponse({ status: 404, description: 'Aucun utilisateur trouvé' })
  async searchAll(@Query('q') query: string): Promise<User[]> {
    if (!query) {
      throw new NotFoundException('Veuillez fournir un texte de recherche');
    }

    const results = await this.usersService.searchAll(query);

    return results;
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Afficher la liste des utilisateurs' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs récupérée avec succès.' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Afficher les détails d’un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l’utilisateur à consulter' })
  @ApiResponse({ status: 200, description: 'Utilisateur trouvé.' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l’utilisateur à modifier' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l’utilisateur à supprimer' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // ---------------- Recherche ARBITRES ----------------
  @Get('search/arbitres')
  @ApiOperation({ summary: 'Rechercher des arbitres par nom, prénom ou email' })
  @ApiQuery({ name: 'q', description: 'Texte de recherche' })
  @ApiResponse({ status: 200, description: 'Liste des arbitres correspondants.' })
  searchArbitres(@Param() query: any, @Query('q') q: string) {
    return this.usersService.searchArbitres(q);
  }

  // ---------------- Recherche JOUEURS ----------------
  @Get('search/joueurs')
  @ApiOperation({ summary: 'Rechercher des joueurs par nom, prénom ou email' })
  @ApiQuery({ name: 'q', description: 'Texte de recherche' })
  @ApiResponse({ status: 200, description: 'Liste des joueurs correspondants.' })
  searchJoueurs(@Param() query: any, @Query('q') q: string) {
    return this.usersService.searchJoueurs(q);
  }

  // ---------------- Recherche COACH ----------------
  @Get('search/coach')
  @ApiOperation({ summary: 'Rechercher des Coach par nom, prénom ou email' })
  @ApiQuery({ name: 'q', description: 'Texte de recherche' })
  @ApiResponse({
    status: 200,
    description: 'Liste des coach correspondants.',
  })
  searchCoach(@Param() query: any, @Query('q') q: string) {
    return this.usersService.searchCoach(q);
  }

  // ---------------- Stats de Profil ----------------
  @Get(':id/profile-stats')
  @ApiOperation({ summary: 'Obtenir les statistiques de profil selon le rôle de l\'utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques de profil récupérées avec succès.',
  })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable.' })
  getProfileStats(@Param('id') id: string) {
    return this.usersService.getProfileStats(id);
  }

  @Post('names')
  @ApiOperation({ summary: 'Obtenir les noms pour une liste d\'IDs' })
  @ApiResponse({ status: 200, description: 'Map des IDs vers les noms.' })
  async getNames(@Body('ids') ids: string[]) {
    return this.usersService.getNames(ids);
  }
}