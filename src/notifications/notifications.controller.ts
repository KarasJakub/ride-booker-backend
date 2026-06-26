import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { CreateNotificationTemplateDto } from './dto/create-notification-template';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notification-templates')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Lista szablonów powiadomień (zakres zależny od roli)' })
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.notificationsService.findAll(userId, userRole);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Utwórz szablon powiadomienia' })
  create(
    @Body() dto: CreateNotificationTemplateDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.notificationsService.create(dto, userId, userRole);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Edytuj szablon powiadomienia' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationTemplateDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.notificationsService.update(id, dto, userId, userRole);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Usuń szablon powiadomienia' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.notificationsService.remove(id, userId, userRole);
  }
}