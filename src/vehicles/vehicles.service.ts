import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CreateVehicleTypeDto } from './dto/create-vehicle-type.dto';
import { SupabaseService } from '../auth/supabase.service'

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService, private supabase: SupabaseService,) {}

  // --- Vehicles types ---

  async findAllTypes() {
    return this.prisma.vehicleType.findMany({
      include: {
        _count: { select: { vehicles: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createType(dto: CreateVehicleTypeDto) {
    const existing = await this.prisma.vehicleType.findUnique({
      where: { name: dto.name },
    });
    if (existing) throw new BadRequestException('This vehicle type already exists');

    return this.prisma.vehicleType.create({ data: dto });
  }

  async removeType(id: string) {
    const type = await this.prisma.vehicleType.findUnique({ where: { id } });
    if (!type) throw new NotFoundException('Vehicle type not found');

    const vehiclesCount = await this.prisma.vehicle.count({
      where: { typeId: id },
    });
    if (vehiclesCount > 0) {
      throw new BadRequestException('You cannot delete a type that has assigned vehicles');
    }

    return this.prisma.vehicleType.delete({ where: { id } });
  }

  // --- Vehicles ---

  async findAll(typeId?: string, isActive?: boolean, organizationId?: string) {
  return this.prisma.vehicle.findMany({
    where: {
      ...(typeId && { typeId }),
      ...(isActive !== undefined && { isActive }),
      ...(organizationId && { organizationId }),
    },
    include: {
      type: { select: { id: true, name: true } },
      _count: { select: { inventory: true, favorites: true } },
    },
    orderBy: { name: 'asc' },
  });
}

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        type: { select: { id: true, name: true } },
        inventory: {
          include: {
            location: {
              select: {
                id: true, name: true, city: true, isActive: true,
              },
            },
          },
          where: { isAvailable: true },
        },
      },
    });

    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  async create(dto: CreateVehicleDto, userId: string, userRole: string) {
  const type = await this.prisma.vehicleType.findUnique({
    where: { id: dto.typeId },
  });
  if (!type) throw new NotFoundException('Vehicle type not found');

  let organizationId = dto.organizationId;

  if (userRole === 'ORG_ADMIN') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.organizationId) {
      throw new BadRequestException('You do not have an assigned organization');
    }
    if (dto.organizationId !== user.organizationId) {
      throw new BadRequestException('You can only add vehicles to your own organization');
    }
    organizationId = user.organizationId;
  }

  return this.prisma.vehicle.create({
    data: {
      name: dto.name,
      typeId: dto.typeId,
      organizationId,
      engineCapacity: dto.engineCapacity,
      power: dto.power,
      description: dto.description,
      imageUrl: dto.imageUrl,
    },
    include: {
      type: { select: { id: true, name: true } },
    },
  });
}

  async update(id: string, dto: UpdateVehicleDto) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    if (dto.typeId) {
      const type = await this.prisma.vehicleType.findUnique({
        where: { id: dto.typeId },
      });
      if (!type) throw new NotFoundException('Vehicle type not found');
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: dto,
      include: {
        type: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const inventoryCount = await this.prisma.locationVehicle.count({
      where: { vehicleId: id },
    });
    if (inventoryCount > 0) {
      throw new BadRequestException(
        'You cannot delete a vehicle that is assigned to a location',
      );
    }

    return this.prisma.vehicle.delete({ where: { id } });
  }

  async uploadImage(id: string, file: any) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    if (!file) throw new BadRequestException('No file provided');

    const extension = file.originalname.split('.').pop();
    const path = `${id}.${extension}`;

    const publicUrl = await this.supabase.uploadFile('vehicles', path, file.buffer, file.mimetype);

    return this.prisma.vehicle.update({
      where: { id },
      data: { imageUrl: publicUrl },
      include: { type: { select: { id: true, name: true } } },
    });
}
}