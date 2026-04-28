import {
  CanActivate, ExecutionContext,
  Injectable, UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private supabase: SupabaseService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers['authorization'];

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token missing or malformed');
    }

    const token = authorization.replace('Bearer ', '');
    const client = this.supabase.getClient();

    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.prisma.user.findUnique({
      where: { supabaseId: data.user.id },
      select: {
        id: true, email: true, fullName: true, role: true, isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    request.user = user;
    return true;
  }
}