import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CreateVehicleTypeDto } from './dto/create-vehicle-type.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

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
    if (existing) throw new BadRequestException('Typ pojazdu już istnieje');

    return this.prisma.vehicleType.create({ data: dto });
  }

  async removeType(id: string) {
    const type = await this.prisma.vehicleType.findUnique({ where: { id } });
    if (!type) throw new NotFoundException('Typ pojazdu nie znaleziony');

    const vehiclesCount = await this.prisma.vehicle.count({
      where: { typeId: id },
    });
    if (vehiclesCount > 0) {
      throw new BadRequestException('Nie można usunąć typu który ma przypisane pojazdy');
    }

    return this.prisma.vehicleType.delete({ where: { id } });
  }

  // --- Vehicles ---

  async findAll(typeId?: string, isActive?: boolean) {
    return this.prisma.vehicle.findMany({
      where: {
        ...(typeId && { typeId }),
        ...(isActive !== undefined && { isActive }),
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

    if (!vehicle) throw new NotFoundException('Pojazd nie znaleziony');
    return vehicle;
  }

  async create(dto: CreateVehicleDto) {
    const type = await this.prisma.vehicleType.findUnique({
      where: { id: dto.typeId },
    });
    if (!type) throw new NotFoundException('Typ pojazdu nie znaleziony');

    return this.prisma.vehicle.create({
      data: dto,
      include: {
        type: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, dto: UpdateVehicleDto) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Pojazd nie znaleziony');

    if (dto.typeId) {
      const type = await this.prisma.vehicleType.findUnique({
        where: { id: dto.typeId },
      });
      if (!type) throw new NotFoundException('Typ pojazdu nie znaleziony');
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
    if (!vehicle) throw new NotFoundException('Pojazd nie znaleziony');

    const inventoryCount = await this.prisma.locationVehicle.count({
      where: { vehicleId: id },
    });
    if (inventoryCount > 0) {
      throw new BadRequestException(
        'Nie można usunąć pojazdu który jest przypisany do lokalizacji',
      );
    }

    return this.prisma.vehicle.delete({ where: { id } });
  }
}