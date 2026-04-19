import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseService } from './supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  async register(dto: RegisterDto) {
    const client = this.supabase.getClient();

    const { data, error } = await client.auth.signUp({
      email: dto.email,
      password: dto.password,
    });

    if (error) throw new BadRequestException(error.message);
    if (!data.user) throw new BadRequestException('Błąd rejestracji');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        phone: dto.phone,
        supabaseId: data.user.id,
      },
      select: {
        id: true, email: true, fullName: true, phone: true, role: true,
      },
    });

    return { message: 'Rejestracja zakończona pomyślnie', user };
  }

  async login(dto: LoginDto) {
    const client = this.supabase.getClient();

    const { data, error } = await client.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) throw new UnauthorizedException('Nieprawidłowy email lub hasło');

    const user = await this.prisma.user.findUnique({
      where: { supabaseId: data.user.id },
      select: {
        id: true, email: true, fullName: true, role: true, isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Konto nieaktywne');
    }

    return {
      user,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async refresh(refreshToken: string) {
    const client = this.supabase.getClient();

    const { data, error } = await client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) throw new UnauthorizedException('Nieważny refresh token');

    return {
      accessToken: data?.session?.access_token,
      refreshToken: data?.session?.refresh_token,
    };
  }

  async logout(accessToken: string) {
    const client = this.supabase.getClient();
    await client.auth.signOut();
    return { message: 'Wylogowano pomyślnie' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const client = this.supabase.getClient();

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Użytkownik nie znaleziony');

    const { error: loginError } = await client.auth.signInWithPassword({
      email: user.email,
      password: dto.oldPassword,
    });

    if (loginError) throw new UnauthorizedException('Stare hasło jest nieprawidłowe');

    const { error } = await client.auth.updateUser({
      password: dto.newPassword,
    });

    if (error) throw new BadRequestException(error.message);

    return { message: 'Hasło zostało zmienione' };
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, fullName: true,
        phone: true, role: true, createdAt: true,
      },
    });
  }
}