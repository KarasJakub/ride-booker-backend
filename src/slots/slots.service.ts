import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';

@Injectable()
export class SlotsService {
  constructor(private prisma: PrismaService) {}

  // Helper - checks if user has access to the locationVehicle
private async assertAccess(userId: string, userRole: string, locationVehicleId: string) {
  if (userRole === 'SUPER_ADMIN') return;

  const lv = await this.prisma.locationVehicle.findUnique({
    where: { id: locationVehicleId },
    include: { location: true },
  });
  if (!lv) throw new NotFoundException('Inventory item not found');

  if (userRole === 'ORG_ADMIN') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.organizationId !== lv.location.organizationId) {
      throw new ForbiddenException('No access to this location');
    }
  }

  if (userRole === 'BRANCH_ADMIN') {
    if (lv.location.branchAdminId !== userId) {
      throw new ForbiddenException('You can only manage slots for your location');
    }
  }
}

  // Admin view — all slots with optional filters (SUPER_ADMIN, ORG_ADMIN)
  async findAll(
    userId: string,
    userRole: string,
    organizationId?: string,
    locationId?: string,
  ) {
    let scopeFilter: any = {};

    if (userRole === 'ORG_ADMIN') {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      scopeFilter = {
        locationVehicle: {
          location: { organizationId: user?.organizationId },
        },
      };
    }
    // SUPER_ADMIN sees everything — scopeFilter stays {}

    return this.prisma.slot.findMany({
      where: {
        AND: [
          scopeFilter,
          { startTime: { gte: new Date() } },
          ...(organizationId
            ? [{ locationVehicle: { location: { organizationId } } }]
            : []),
          ...(locationId
            ? [{ locationVehicle: { locationId } }]
            : []),
        ],
      },
      include: {
        locationVehicle: {
          include: {
            vehicle: { select: { id: true, name: true, imageUrl: true } },
            location: { select: { id: true, name: true, city: true, organizationId: true } },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findByLocationVehicle(locationVehicleId: string, onlyAvailable?: boolean) {
    const lv = await this.prisma.locationVehicle.findUnique({
      where: { id: locationVehicleId },
    });
    if (!lv) throw new NotFoundException('Inventory item not found');

    return this.prisma.slot.findMany({
      where: {
        locationVehicleId,
        ...(onlyAvailable && { isAvailable: true }),
        startTime: { gte: new Date() }, // only future slots
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findByLocation(locationId: string) {
    return this.prisma.slot.findMany({
      where: {
        locationVehicle: { locationId },
        startTime: { gte: new Date() },
      },
      include: {
        locationVehicle: {
          include: {
            vehicle: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOne(id: string) {
    const slot = await this.prisma.slot.findUnique({
      where: { id },
      include: {
        locationVehicle: {
          include: {
            vehicle: { select: { id: true, name: true } },
            location: { select: { id: true, name: true, city: true } },
          },
        },
        booking: true,
      },
    });

    if (!slot) throw new NotFoundException('Slot not found');
    return slot;
  }

  async create(dto: CreateSlotDto, userId: string, userRole: string) {
    await this.assertAccess(userId, userRole, dto.locationVehicleId);

    // Booking times validation
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (end <= start) {
      throw new BadRequestException('endTime must be later than startTime');
    }

    if (start < new Date()) {
      throw new BadRequestException('Cannot create slots in the past');
    }

    // Check for overlapping slots
    const overlapping = await this.prisma.slot.findFirst({
      where: {
        locationVehicleId: dto.locationVehicleId,
        OR: [
          {
            startTime: { lt: end },
            endTime: { gt: start },
          },
        ],
      },
    });

    if (overlapping) {
      throw new BadRequestException('Slot overlaps with an existing slot');
    }

    return this.prisma.slot.create({
      data: {
        locationVehicleId: dto.locationVehicleId,
        startTime: start,
        endTime: end,
        isAvailable: dto.isAvailable ?? true,
      },
      include: {
        locationVehicle: {
          include: {
            vehicle: { select: { id: true, name: true } },
            location: { select: { id: true, name: true, city: true } },
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateSlotDto, userId: string, userRole: string) {
    const slot = await this.prisma.slot.findUnique({ where: { id }, include: { booking: true } });
    if (!slot) throw new NotFoundException('Slot not found');

    await this.assertAccess(userId, userRole, slot.locationVehicleId);

    if (slot.booking) {
      throw new BadRequestException('Cannot edit a slot that has a booking');
    }

    if (dto.startTime && dto.endTime) {
      const start = new Date(dto.startTime);
      const end = new Date(dto.endTime);
      if (end <= start) {
        throw new BadRequestException('endTime must be later than startTime');
      }
    }

    return this.prisma.slot.update({
      where: { id },
      data: {
        ...(dto.startTime && { startTime: new Date(dto.startTime) }),
        ...(dto.endTime && { endTime: new Date(dto.endTime) }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
      },
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const slot = await this.prisma.slot.findUnique({
      where: { id },
      include: { booking: true },
    });
    if (!slot) throw new NotFoundException('Slot not found');

    await this.assertAccess(userId, userRole, slot.locationVehicleId);

    if (slot.booking) {
      throw new BadRequestException('Cannot delete a slot that has a booking');
    }

    return this.prisma.slot.delete({ where: { id } });
  }
}