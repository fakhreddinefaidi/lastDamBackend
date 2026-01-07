import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjuryService } from '../injury.service';

@Injectable()
export class PlayerOwnershipGuard implements CanActivate {
  constructor(private injuryService: InjuryService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const injuryId = request.params.injuryId;

    if (!user || !user.userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // If user is academy or referee, allow access
    if (user.role === 'academie' || user.role === 'arbitre') {
      return true;
    }

    // For players, check ownership
    if (user.role === 'joueur') {
      const injury = await this.injuryService.findOne(injuryId);
      if (!injury) {
        throw new NotFoundException(`Injury with ID ${injuryId} not found`);
      }

      if (injury.playerId !== user.userId) {
        throw new ForbiddenException(
          'You can only access your own injuries',
        );
      }
    }

    return true;
  }
}

