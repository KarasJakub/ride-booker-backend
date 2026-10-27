import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BookingsScheduler {
  private readonly logger = new Logger(BookingsScheduler.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async closeExpiredBookings() {
    const now = new Date();

    const expired = await this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        slot: {
          endTime: { lt: now },
        },
      },
      select: { id: true },
    });

    if (expired.length === 0) return;

    const result = await this.prisma.booking.updateMany({
      where: {
        id: { in: expired.map((b) => b.id) },
      },
      data: { status: 'COMPLETED' },
    });

    this.logger.log(`Automaticlly ended ${result.count} bookings`);
  }
}