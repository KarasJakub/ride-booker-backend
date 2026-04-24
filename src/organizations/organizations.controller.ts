import {
  Body, Controller, Delete, Get,
  Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista organizacji' })
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Szczegóły organizacji' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Post()
  @Roles('SUPER_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Utwórz organizację (SUPER_ADMIN)' })
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(dto);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Edytuj organizację (SUPER_ADMIN lub ORG_ADMIN swojej org)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.organizationsService.update(id, dto, userId, userRole);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Usuń organizację (SUPER_ADMIN)' })
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }

  @Post(':id/assign-admin')
  @Roles('SUPER_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Przypisz ORG_ADMIN do organizacji (SUPER_ADMIN)' })
  assignOrgAdmin(
    @Param('id') organizationId: string,
    @Body('userId') userId: string,
  ) {
    return this.organizationsService.assignOrgAdmin(organizationId, userId);
  }
}