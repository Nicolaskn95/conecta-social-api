import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@/common/decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!allowedRoles?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const hasRole = user?.role && allowedRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        'Acesso negado. Nível de permissão insuficiente.'
      );
    }

    return true;
  }
}
