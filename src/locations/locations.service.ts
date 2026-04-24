import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId?: string) {
    return this.prisma.location.findMany({
      where: organizationId ? { organizationId } : undefined,
      include: {
        organization: { select: { id: true, name: true } },
        branchAdmin: { select: { id: true, email: true, fullName: true } },
        _count: { select: { inventory: true } },
      },
      orderBy: { city: 'asc' },
    });
  }

  async findOne(id: string) {
    const location = await this.prisma.location.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true } },
        branchAdmin: { select: { id: true, email: true, fullName: true } },
        inventory: {
          include: {
            vehicle: {
              select: { id: true, name: true, imageUrl: true },
            },
          },
        },
      },
    });

    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  async create(dto: CreateLocationDto, userId: string, userRole: string) {
    // ORG_ADMIN może tworzyć tylko w swojej organizacji
    if (userRole === 'ORG_ADMIN') {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.organizationId !== dto.organizationId) {
        throw new ForbiddenException('You can only create locations in your organization');
      }
    }

    return this.prisma.location.create({
      data: dto,
      include: {
        organization: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, dto: UpdateLocationDto, userId: string, userRole: string) {
    const location = await this.prisma.location.findUnique({ where: { id } });
    if (!location) throw new NotFoundException('Location not found');

    if (userRole === 'ORG_ADMIN') {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.organizationId !== location.organizationId) {
        throw new ForbiddenException('You do not have access to this location');
      }
    }

    if (userRole === 'BRANCH_ADMIN') {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      const managedLocation = await this.prisma.location.findFirst({
        where: { branchAdminId: user?.id },
      });
      if (managedLocation?.id !== id) {
        throw new ForbiddenException('You can only edit your assigned location');
      }
    }

    return this.prisma.location.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const location = await this.prisma.location.findUnique({ where: { id } });
    if (!location) throw new NotFoundException('Location not found');
    return this.prisma.location.delete({ where: { id } });
  }

  async assignBranchAdmin(locationId: string, userId: string) {
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
    });
    if (!location) throw new NotFoundException('Location not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (location.branchAdminId) {
      throw new BadRequestException('Location already has an assigned admin');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'BRANCH_ADMIN' },
    });

    return this.prisma.location.update({
      where: { id: locationId },
      data: { branchAdminId: userId },
      include: {
        branchAdmin: { select: { id: true, email: true, fullName: true } },
      },
    });
  }
}