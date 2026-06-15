import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  // User view — reservations of the user
  async findMine(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        slot: {
          include: {
            locationVehicle: {
              include: {
                vehicle: {
                  select: { id: true, name: true, imageUrl: true },
                },
                location: {
                  select: { id: true, name: true, city: true, address: true, phone: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin view — reservations of the location
  async findByLocation(locationId: string, userId: string, userRole: string) {
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
    });
    if (!location) throw new NotFoundException('Location not found');

    // Check visibility for admin
    if (userRole === 'ORG_ADMIN') {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.organizationId !== location.organizationId) {
        throw new ForbiddenException('No access to this locations reservations');
      }
    }

    if (userRole === 'BRANCH_ADMIN') {
      if (location.branchAdminId !== userId) {
        throw new ForbiddenException('You can only view reservations for your location');
      }
    }

    return this.prisma.booking.findMany({
      where: {
        slot: {
          locationVehicle: { locationId },
        },
      },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, phone: true },
        },
        slot: {
          include: {
            locationVehicle: {
              include: {
                vehicle: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, phone: true },
        },
        slot: {
          include: {
            locationVehicle: {
              include: {
                vehicle: { select: { id: true, name: true, imageUrl: true } },
                location: { select: { id: true, name: true, city: true } },
              },
            },
          },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    // User can only view their own bookings
    if (userRole === 'USER' && booking.userId !== userId) {
      throw new ForbiddenException('No access to this booking');
    }

    return booking;
  }

  async create(dto: CreateBookingDto, userId: string) {
    // 1. Check slot
    const slot = await this.prisma.slot.findUnique({
      where: { id: dto.slotId },
      include: { booking: true },
    });

    if (!slot) throw new NotFoundException('Slot not found');
    if (!slot.isAvailable) throw new BadRequestException('Slot is not available');
    if (slot.booking) throw new BadRequestException('Slot is already booked');
    if (slot.startTime < new Date()) {
      throw new BadRequestException('Cannot book slots in the past');
    }

    // 2. Check if user already has a reservation in this time
    const conflict = await this.prisma.booking.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        slot: {
          startTime: { lt: slot.endTime },
          endTime: { gt: slot.startTime },
        },
      },
    });

    if (conflict) {
      throw new BadRequestException('You already have a booking that overlaps with this time');
    }

    // 3. Create booking and block slot
    const [booking] = await this.prisma.$transaction([
      this.prisma.booking.create({
        data: {
          userId,
          slotId: dto.slotId,
          notes: dto.notes,
          status: 'PENDING',
        },
        include: {
          slot: {
            include: {
              locationVehicle: {
                include: {
                  vehicle: { select: { id: true, name: true } },
                  location: { select: { id: true, name: true, city: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.slot.update({
        where: { id: dto.slotId },
        data: { isAvailable: false },
      }),
    ]);

    return booking;
  }

  async updateStatus(
    id: string,
    dto: UpdateBookingStatusDto,
    userId: string,
    userRole: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        slot: {
          include: {
            locationVehicle: {
              include: { location: true },
            },
          },
        },
      },
    }
  );

    if (!booking) throw new NotFoundException('Booking not found');

    const location = booking.slot.locationVehicle.location;

    // Check admin access
    if (userRole === 'BRANCH_ADMIN' && location.branchAdminId !== userId) {
      throw new ForbiddenException('No access to this booking');
    }

    if (userRole === 'ORG_ADMIN') {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.organizationId !== location.organizationId) {
        throw new ForbiddenException('No access to this booking');
      }
    }

    // Validation of status transitions
    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED'],
      REJECTED: [],
      CANCELLED: [],
      COMPLETED: [],
    };

    if (!allowedTransitions[booking.status].includes(dto.status)) {
      throw new BadRequestException(
        `Cannot change status from ${booking.status} to ${dto.status}`,
      );
    }

    // If booking is cancelled or rejected, free the slot
    const freeSlot = ['CANCELLED', 'REJECTED'].includes(dto.status);

    const [updated] = await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id },
        data: { status: dto.status, ...(dto.rejectionReason && { rejectionReason: dto.rejectionReason }), },
      }),
      ...(freeSlot
        ? [
            this.prisma.slot.update({
              where: { id: booking.slotId },
              data: { isAvailable: true },
            }),
          ]
        : []),
    ]);

    return updated;
  }

  // User can cancel their own booking if it's pending or confirmed
  async cancelMine(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) {
      throw new ForbiddenException('This is not your booking');
    }
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new BadRequestException('Cannot cancel this booking');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id },
        data: { status: 'CANCELLED' },
      }),
      this.prisma.slot.update({
        where: { id: booking.slotId },
        data: { isAvailable: true },
      }),
    ]);

    return updated;
  }
}