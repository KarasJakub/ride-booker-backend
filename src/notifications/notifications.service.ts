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

  // --- Wysyłka na podstawie zdarzenia ---

  async dispatch(
    eventType: string,
    recipientType: 'USER' | 'BRANCH_ADMIN',
    recipientEmail: string,
    variables: Record<string, string>,
    locationId?: string,
  ) {
    // Szukamy szablonu: najpierw przypisanego do oddziału, potem globalnego
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
      orderBy: { locationId: 'desc' }, // przypisany do lokalizacji ma priorytet nad globalnym
    });

    if (!template) {
      console.warn(`Brak aktywnego szablonu dla ${eventType} / ${recipientType}`);
      return { sent: false, reason: 'no_template' };
    }

    const subject = renderTemplate(template.title, variables);
    const html = renderTemplate(template.bodyHtml, variables);

    const result = await this.emailService.send(recipientEmail, subject, html);
    return { sent: result.success, templateId: template.id };
  }

  // --- CRUD szablonów ---

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
    // SUPER_ADMIN widzi wszystko — where zostaje {}

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
        throw new BadRequestException('Możesz tworzyć szablony tylko dla swojego oddziału');
      }
    }

    if (!dto.locationId && userRole !== 'SUPER_ADMIN' && userRole !== 'ORG_ADMIN') {
      throw new BadRequestException('Tylko Super Admin i Org Admin mogą tworzyć szablony globalne');
    }

    return this.prisma.notificationTemplate.create({
      data: dto,
      include: { location: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, dto: UpdateNotificationTemplateDto, userId: string, userRole: string) {
    const template = await this.prisma.notificationTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Szablon nie znaleziony');

    if (userRole === 'BRANCH_ADMIN') {
      const location = await this.prisma.location.findFirst({
        where: { branchAdminId: userId },
      });
      if (template.locationId !== location?.id) {
        throw new BadRequestException('Brak dostępu do tego szablonu');
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
    if (!template) throw new NotFoundException('Szablon nie znaleziony');

    if (userRole === 'BRANCH_ADMIN') {
      const location = await this.prisma.location.findFirst({
        where: { branchAdminId: userId },
      });
      if (template.locationId !== location?.id) {
        throw new BadRequestException('Brak dostępu do tego szablonu');
      }
    }

    return this.prisma.notificationTemplate.delete({ where: { id } });
  }
}