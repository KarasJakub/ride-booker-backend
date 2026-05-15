import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
  imports: [AuthModule],
})
export class BookingsModule {}