import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflactor: Reflector,
  ) { }
  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requiredRoles = this.reflactor.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return false;

    const { user } = context.switchToHttp().getRequest().user;

    if (!user || user.role) throw new ForbiddenException('User role not found');

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) throw new ForbiddenException('User does not have the required role');

    return true;
  }
}
