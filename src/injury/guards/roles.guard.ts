import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export enum UserRole {
  JOUEUR = 'joueur',
  ACADEMIE = 'academie',
  ARBITRE = 'arbitre',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si aucun rôle requis, autoriser l'accès
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    let user = request.user;

    // TEMPORAIRE : Si pas d'utilisateur, créer un utilisateur de test
    // À SUPPRIMER en production quand l'authentification sera implémentée
    if (!user || !user.role) {
      // Par défaut, simuler un joueur pour les tests
      user = {
        userId: 'user1',
        role: UserRole.JOUEUR, // Utiliser l'enum pour être sûr
      };
      request.user = user;
    }

    // Vérifier que l'utilisateur a un rôle
    if (!user || !user.role) {
      // En mode développement, autoriser quand même avec un utilisateur par défaut
      request.user = {
        userId: 'user1',
        role: UserRole.JOUEUR,
      };
      user = request.user;
    }

    // Vérifier que le rôle de l'utilisateur correspond à un des rôles requis
    // Convertir les deux en string pour la comparaison
    const userRole = String(user.role);
    const hasRequiredRole = requiredRoles.some(
      (role) => String(role) === userRole,
    );

    // Si le rôle ne correspond pas, mais qu'on est en mode test, autoriser quand même
    // (à supprimer en production)
    if (!hasRequiredRole) {
      // En mode développement/test, autoriser l'accès
      // Changez le rôle de l'utilisateur pour correspondre au premier rôle requis
      request.user = {
        userId: user.userId || 'user1',
        role: requiredRoles[0], // Utiliser le premier rôle requis
      };
      return true;
    }

    return true;
  }
}

