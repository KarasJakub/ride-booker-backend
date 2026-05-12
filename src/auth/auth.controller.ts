import {
  Body, Controller, Delete, Get, HttpCode,
  HttpStatus, Param, Patch, Post, Req, UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { RolesGuard } from './guards/roles.guard'
import { Roles } from './decorators/roles.decorator'
import type { Response } from 'express';
import { Res } from '@nestjs/common';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Rejestracja' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

@Post('login')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Logowanie' })
async login(
  @Body() dto: LoginDto,
  @Res({ passthrough: true }) res: Response,
) {
  const data = await this.authService.login(dto);

  // Set refresh token in HttpOnly cookie
  res.cookie('refreshToken', data.refreshToken, {
    httpOnly: true,       // not accessible via JS
    secure: false,        // set to true in production (HTTPS)
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  // Return only accessToken and user data (without refreshToken)
  return {
    user: data.user,
    accessToken: data.accessToken,
  };
}

@Post('refresh')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Odnów access token' })
async refresh(
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
) {
  // Download refresh token from cookie
  const refreshToken = (req as any).cookies?.refreshToken;
  if (!refreshToken) {
    throw new UnauthorizedException('Brak refresh tokena');
  }

  const data = await this.authService.refresh(refreshToken);

  // Set new refresh token in cookie
  res.cookie('refreshToken', data.refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  return { accessToken: data.accessToken };
}


@Post('logout')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Wylogowanie' })
async logout(
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
) {
  const refreshToken = (req as any).cookies?.refreshToken;

  if (refreshToken) {
    await this.authService.logout(refreshToken);
  }

  // Clear the refresh token cookie
  res.clearCookie('refreshToken', { path: '/' });

  return { message: 'Wylogowano pomyślnie' };
}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dane zalogowanego użytkownika' })
  getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Zmiana hasła' })
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Edycja profilu (imię, telefon, email)' })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(userId, dto);
}

  // Passwod reset
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Wyślij link do resetowania hasła' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // Deleting own account
  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Usuń własne konto' })
  deleteOwnAccount(@CurrentUser('id') userId: string) {
    return this.authService.deleteOwnAccount(userId);
  }

  // Deleting any account by admin
  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Usuń konto użytkownika (admin)' })
  deleteAccountByAdmin(@Param('id') targetUserId: string) {
    return this.authService.deleteAccountByAdmin(targetUserId);
  }
}