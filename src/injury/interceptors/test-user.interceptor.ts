import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Interceptor temporaire pour les tests
 * Simule un utilisateur authentifié
 * À REMPLACER par un vrai système d'authentification en production
 */
@Injectable()
export class TestUserInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Si aucun utilisateur n'est défini, simuler un utilisateur pour les tests
    if (!request.user) {
      // Par défaut, simuler un joueur
      // Vous pouvez changer le rôle selon l'endpoint testé
      request.user = {
        userId: 'user1', // ID de test
        role: 'joueur', // 'joueur', 'academie', ou 'arbitre'
      };
    }

    return next.handle();
  }
}

