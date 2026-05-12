import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
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
      throw new UnauthorizedException('Brak tokena');
    }

    const token = authorization.replace('Bearer ', '');

    // Client with token to verify and get user info
    const client = this.supabase.getClientWithToken(token);
    const { data, error } = await client.auth.getUser();

    if (error || !data.user) {
      throw new UnauthorizedException('Nieważny token');
    }

    const user = await this.prisma.user.findUnique({
      where: { supabaseId: data.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Użytkownik nie znaleziony lub nieaktywny');
    }

    request.user = user;
    return true;
  }
}