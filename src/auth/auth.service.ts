import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseService } from './supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'

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
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        organizationId: true,
        managedLocation: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
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
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
        organizationId: true,
        managedLocation: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
      },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
  const client = this.supabase.getClient();

  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthorizedException('Użytkownik nie znaleziony');

  // Require password if email is being changed
  if (dto.email && dto.email !== user.email) {
    if (!dto.password) {
      throw new BadRequestException('Podaj hasło aby zmienić email');
    }

    const { error: loginError } = await client.auth.signInWithPassword({
      email: user.email,
      password: dto.password,
    });
    if (loginError) throw new UnauthorizedException('Nieprawidłowe hasło');

    const { error: supabaseError } = await client.auth.updateUser({
      email: dto.email,
    });
    if (supabaseError) throw new BadRequestException(supabaseError.message);
  }

  return this.prisma.user.update({
    where: { id: userId },
    data: {
      ...(dto.fullName && { fullName: dto.fullName }),
      ...(dto.phone && { phone: dto.phone }),
      ...(dto.email && { email: dto.email }),
    },
    select: {
      id: true, email: true, fullName: true, phone: true, role: true,
    },
  });
}

async resetPassword(dto: ResetPasswordDto) {
  const client = this.supabase.getClient();

  const { error } = await client.auth.resetPasswordForEmail(dto.email, {
    redirectTo: `${process.env.APP_URL}/auth/new-password`,
  });

  if (error) throw new BadRequestException(error.message);

  // TODO: "Make it more dynamic and in EN"
  return { message: 'Jeśli konto istnieje, wysłaliśmy link do resetowania hasła' };
}

async deleteOwnAccount(userId: string) {
  const client = this.supabase.getClient();

  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthorizedException('Użytkownik nie znaleziony');

  // Delete from prisma
  await this.prisma.user.delete({ where: { id: userId } });

  // Delete from Supabase
  await client.auth.admin.deleteUser(user.supabaseId);

  return { message: 'Konto zostało usunięte' };
}

async deleteAccountByAdmin(targetUserId: string) {
  const client = this.supabase.getClient();

  const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw new NotFoundException('Użytkownik nie znaleziony');

  await this.prisma.user.delete({ where: { id: targetUserId } });
  await client.auth.admin.deleteUser(user.supabaseId);

  return { message: 'Konto użytkownika zostało usunięte' };
}

}