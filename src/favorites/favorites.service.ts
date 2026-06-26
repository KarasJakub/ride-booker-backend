import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async findMine(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        vehicle: {
          include: {
            type: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async add(userId: string, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const existing = await this.prisma.favorite.findUnique({
      where: { userId_vehicleId: { userId, vehicleId } },
    });
    if (existing) throw new BadRequestException('Already in favorites');

    return this.prisma.favorite.create({
      data: { userId, vehicleId },
      include: {
        vehicle: {
          include: { type: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async remove(userId: string, vehicleId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_vehicleId: { userId, vehicleId } },
    });
    if (!existing) throw new NotFoundException('Favorite not found');

    return this.prisma.favorite.delete({
      where: { userId_vehicleId: { userId, vehicleId } },
    });
  }
}