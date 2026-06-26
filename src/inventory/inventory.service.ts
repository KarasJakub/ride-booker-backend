import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssignVehicleDto } from './dto/assign-vehicle.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // Helper to check if user has access to the location (for SUPER_ADMIN, ORG_ADMIN, BRANCH_ADMIN)
  private async assertLocationAccess(userId: string, userRole: string, locationId: string) {
    if (userRole === 'SUPER_ADMIN') return;

    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
    });
    if (!location) throw new NotFoundException('Location not found');

    if (userRole === 'ORG_ADMIN') {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.organizationId !== location.organizationId) {
        throw new ForbiddenException('You do not have access to this location');
      }
    }

    if (userRole === 'BRANCH_ADMIN') {
      if (location.branchAdminId !== userId) {
        throw new ForbiddenException('You can only manage your own location');
      }
    }
  }

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
        location: { organizationId: user?.organizationId },
      };
    }
    // SUPER_ADMIN sees everything — scopeFilter stays {}

    return this.prisma.locationVehicle.findMany({
      where: {
        AND: [
          scopeFilter,
          ...(organizationId
            ? [{ location: { organizationId } }]
            : []),
          ...(locationId
            ? [{ locationId }]
            : []),
        ],
      },
      include: {
        vehicle: {
          include: { type: { select: { id: true, name: true } } },
        },
        location: { select: { id: true, name: true, city: true, organizationId: true } },
        _count: { select: { slots: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByLocation(locationId: string) {
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
    });
    if (!location) throw new NotFoundException('Location not found');

    return this.prisma.locationVehicle.findMany({
      where: { locationId },
      include: {
        vehicle: {
          include: {
            type: { select: { id: true, name: true } },
          },
        },
        _count: { select: { slots: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.locationVehicle.findUnique({
      where: { id },
      include: {
        vehicle: {
          include: { type: { select: { id: true, name: true } } },
        },
        location: { select: { id: true, name: true, city: true } },
        slots: {
          where: { isAvailable: true },
          orderBy: { startTime: 'asc' },
          take: 10,
        },
      },
    });

    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async assign(dto: AssignVehicleDto, userId: string, userRole: string) {
    await this.assertLocationAccess(userId, userRole, dto.locationId);

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (!vehicle.isActive) throw new BadRequestException('Vehicle is not active');

    const existing = await this.prisma.locationVehicle.findUnique({
      where: {
        locationId_vehicleId: {
          locationId: dto.locationId,
          vehicleId: dto.vehicleId,
        },
      },
    });
    if (existing) {
      throw new BadRequestException('This vehicle is already assigned to the location.');
    }

    return this.prisma.locationVehicle.create({
      data: {
        locationId: dto.locationId,
        vehicleId: dto.vehicleId,
        quantity: dto.quantity ?? 1,
        isAvailable: dto.isAvailable ?? true,
      },
      include: {
        vehicle: { select: { id: true, name: true } },
        location: { select: { id: true, name: true, city: true } },
      },
    });
  }

  async update(id: string, dto: UpdateInventoryDto, userId: string, userRole: string) {
    const item = await this.prisma.locationVehicle.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException('Inventory item not found');

    await this.assertLocationAccess(userId, userRole, item.locationId);

    return this.prisma.locationVehicle.update({
      where: { id },
      data: dto,
      include: {
        vehicle: { select: { id: true, name: true } },
        location: { select: { id: true, name: true, city: true } },
      },
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const item = await this.prisma.locationVehicle.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException('Inventory item not found');

    await this.assertLocationAccess(userId, userRole, item.locationId);

    const slotsCount = await this.prisma.slot.count({
      where: { locationVehicleId: id },
    });
    if (slotsCount > 0) {
      throw new BadRequestException(
        'Cannot remove inventory item that has assigned slots. Please remove the slots first.',
      );
    }

    return this.prisma.locationVehicle.delete({ where: { id } });
  }
}