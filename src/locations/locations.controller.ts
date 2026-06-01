import {
  Body, Controller, Delete, Get,
  Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@ApiTags('locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista lokalizacji' })
  @ApiQuery({ name: 'organizationId', required: false })
  findAll(@Query('organizationId') organizationId?: string) {
    return this.locationsService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Szczegóły lokalizacji' })
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Utwórz lokalizację (SUPER_ADMIN, ORG_ADMIN)' })
  create(
    @Body() dto: CreateLocationDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.locationsService.create(dto, userId, userRole);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Edytuj lokalizację' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.locationsService.update(id, dto, userId, userRole);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Usuń lokalizację (SUPER_ADMIN, ORG_ADMIN)' })
  remove(@Param('id') id: string) {
    return this.locationsService.remove(id);
  }

  @Post(':id/assign-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Przypisz BRANCH_ADMIN do lokalizacji' })
  assignBranchAdmin(
    @Param('id') locationId: string,
    @Body('userId') userId: string,
  ) {
    return this.locationsService.assignBranchAdmin(locationId, userId);
  }
}