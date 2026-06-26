import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('SUPABASE_JWT_SECRET'),
      }),
    }),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, SupabaseService, JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard, SupabaseService],
})
export class AuthModule {}