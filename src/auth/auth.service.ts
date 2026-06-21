import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseService } from './supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private notifications: NotificationsService,
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

    await this.notifications.dispatch(
      'ACCOUNT_CREATED',
      'USER',
      user.email,
      { username: user.fullName ?? user.email },
    );

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
  const client = this.supabase.getServiceClient();

  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthorizedException('Użytkownik nie znaleziony');

  await this.prisma.user.delete({ where: { id: userId } });

  const { error } = await client.auth.admin.deleteUser(user.supabaseId);
  if (error) {
    console.error('Błąd usuwania użytkownika z Supabase Auth:', error);
  }

  return { message: 'Konto zostało usunięte' };
}

async deleteAccountByAdmin(targetUserId: string) {
  const client = this.supabase.getServiceClient();

  const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw new NotFoundException('Użytkownik nie znaleziony');

  await this.prisma.user.delete({ where: { id: targetUserId } });

  const { error } = await client.auth.admin.deleteUser(user.supabaseId);
  if (error) {
    console.error('Błąd usuwania użytkownika z Supabase Auth:', error);
  }

  return { message: 'Konto użytkownika zostało usunięte' };
}

async updateUserRole(targetUserId: string, role: string, requesterId: string, requesterRole: string) {
  const allowedRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN', 'USER']
  if (!allowedRoles.includes(role)) {
    throw new BadRequestException('Nieprawidłowa rola')
  }

  // ORG_ADMIN could only assign BRANCH_ADMIN
  if (requesterRole === 'ORG_ADMIN' && role !== 'BRANCH_ADMIN') {
    throw new BadRequestException('Org Admin może nadawać tylko rolę Branch Admin')
  }

  // SUPER_ADMIN cannot change itself role and ORG_ADMIN cannot change itself role as well
  if (targetUserId === requesterId) {
    throw new BadRequestException('Nie możesz zmienić własnej roli')
  }

  const user = await this.prisma.user.findUnique({ where: { id: targetUserId } })
  if (!user) throw new NotFoundException('Użytkownik nie znaleziony')

  // If demoting BRANCH_ADMIN, also remove from location
  if (user.role === 'BRANCH_ADMIN' && role !== 'BRANCH_ADMIN') {
    await this.prisma.location.updateMany({
      where: { branchAdminId: targetUserId },
      data: { branchAdminId: null },
    })
  }

  // If demoting ORG_ADMIN, also remove organization association
  if (user.role === 'ORG_ADMIN' && role !== 'ORG_ADMIN') {
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { organizationId: null },
    })
  }

  return this.prisma.user.update({
    where: { id: targetUserId },
    data: { role: role as any },
    select: { id: true, email: true, fullName: true, role: true },
  })
}

async getUsers(search?: string, role?: string, requesterId?: string, requesterRole?: string) {
  let scopeFilter = {}

  if (requesterRole === 'ORG_ADMIN') {
    const requester = await this.prisma.user.findUnique({ where: { id: requesterId } })

    scopeFilter = {
      OR: [
        { role: 'USER' },
        {
          role: 'BRANCH_ADMIN',
          managedLocation: { organizationId: requester?.organizationId },
        },
      ],
    }
  }

  return this.prisma.user.findMany({
    where: {
      AND: [
        scopeFilter,
        ...(search ? [{
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { fullName: { contains: search, mode: 'insensitive' as const } },
          ],
        }] : []),
        ...(role ? [{ role: role as any }] : []),
      ],
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      isActive: true,
      organizationId: true,
      organization: {
        select: { id: true, name: true },
      },
      managedLocation: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

async createUserByAdmin(dto: RegisterDto, requesterId: string, requesterRole: string) {
  const result = await this.register(dto)
  return result
}

}