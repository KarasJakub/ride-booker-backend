import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BookingsScheduler } from './bookings.scheduler';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService, BookingsScheduler, PrismaService],
  exports: [BookingsService],
  imports: [AuthModule, NotificationsModule],
})
export class BookingsModule {}