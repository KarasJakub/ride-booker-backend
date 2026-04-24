import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.organization.findMany({
      include: {
        _count: { select: { locations: true, users: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        locations: {
          select: {
            id: true, name: true, city: true, isActive: true,
          },
        },
        users: {
          where: { role: 'ORG_ADMIN' },
          select: {
            id: true, email: true, fullName: true,
          },
        },
      },
    });

    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async create(dto: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateOrganizationDto, userId: string, userRole: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');

    // ORG_ADMIN can only edit their own organization
    if (userRole === 'ORG_ADMIN') {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.organizationId !== id) {
        throw new ForbiddenException('You can only edit your own organization');
      }
    }

    return this.prisma.organization.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');

    return this.prisma.organization.delete({ where: { id } });
  }

  async assignOrgAdmin(organizationId: string, userId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) throw new NotFoundException('Organization not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.organizationId) {
      throw new BadRequestException('User is already assigned to an organization');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        role: 'ORG_ADMIN',
        organizationId,
      },
      select: {
        id: true, email: true, fullName: true, role: true, organizationId: true,
      },
    });
  }
}