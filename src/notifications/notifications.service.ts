import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';
import { renderTemplate } from './template-variables';
import { CreateNotificationTemplateDto } from './dto/create-notification-template';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // Sending email based on event

  async dispatch(
    eventType: string,
    recipientType: 'USER' | 'BRANCH_ADMIN',
    recipientEmail: string,
    variables: Record<string, string>,
    locationId?: string,
  ) {
    // Search for the most specific template: first look for location-specific, then global
    const template = await this.prisma.notificationTemplate.findFirst({
      where: {
        eventType: eventType as any,
        recipient: recipientType,
        isActive: true,
        OR: [
          { locationId: locationId ?? undefined },
          { locationId: null },
        ],
      },
      orderBy: { locationId: 'desc' }, // Prefer location-specific over global
    });

    if (!template) {
      console.warn(`No active template found for ${eventType} / ${recipientType}`);
      return { sent: false, reason: 'no_template' };
    }

    const subject = renderTemplate(template.title, variables);
    const html = renderTemplate(template.bodyHtml, variables);

    const result = await this.emailService.send(recipientEmail, subject, html);
    return { sent: result.success, templateId: template.id };
  }

  // --- CRUD templates ---

  async findAll(userId: string, userRole: string) {
    let where: any = {};

    if (userRole === 'BRANCH_ADMIN') {
      const location = await this.prisma.location.findFirst({
        where: { branchAdminId: userId },
      });
      where = { locationId: location?.id };
    } else if (userRole === 'ORG_ADMIN') {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      where = {
        OR: [
          { locationId: null },
          { location: { organizationId: user?.organizationId } },
        ],
      };
    }
    // SUPER_ADMIN can see all templates, so no additional filtering needed

    return this.prisma.notificationTemplate.findMany({
      where,
      include: {
        location: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateNotificationTemplateDto, userId: string, userRole: string) {
    if (userRole === 'BRANCH_ADMIN') {
      const location = await this.prisma.location.findFirst({
        where: { branchAdminId: userId },
      });
      if (!location || dto.locationId !== location.id) {
        throw new BadRequestException('You can only create templates for your own branch');
      }
    }

    if (!dto.locationId && userRole !== 'SUPER_ADMIN' && userRole !== 'ORG_ADMIN') {
      throw new BadRequestException('Only Super Admin and Org Admin can create global templates');
    }

    return this.prisma.notificationTemplate.create({
      data: dto,
      include: { location: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, dto: UpdateNotificationTemplateDto, userId: string, userRole: string) {
    const template = await this.prisma.notificationTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');

    if (userRole === 'BRANCH_ADMIN') {
      const location = await this.prisma.location.findFirst({
        where: { branchAdminId: userId },
      });
      if (template.locationId !== location?.id) {
        throw new BadRequestException('You do not have access to this template');
      }
    }

    return this.prisma.notificationTemplate.update({
      where: { id },
      data: dto,
      include: { location: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const template = await this.prisma.notificationTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');

    if (userRole === 'BRANCH_ADMIN') {
      const location = await this.prisma.location.findFirst({
        where: { branchAdminId: userId },
      });
      if (template.locationId !== location?.id) {
        throw new BadRequestException('You do not have access to this template');
      }
    }

    return this.prisma.notificationTemplate.delete({ where: { id } });
  }
}