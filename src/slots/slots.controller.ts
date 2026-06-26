import {
  Body, Controller, Delete, Get,
  Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation,
  ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SlotsService } from './slots.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';

@ApiTags('slots')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Wszystkie sloty z filtrami (SUPER_ADMIN, ORG_ADMIN)' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'locationId', required: false })
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Query('organizationId') organizationId?: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.slotsService.findAll(userId, userRole, organizationId, locationId);
  }

  @Get('location/:locationId')
  @ApiOperation({ summary: 'Wszystkie sloty w lokalizacji' })
  findByLocation(@Param('locationId') locationId: string) {
    return this.slotsService.findByLocation(locationId);
  }


  @Get('inventory/:locationVehicleId')
  @ApiOperation({ summary: 'Sloty dla konkretnego pojazdu w lokalizacji' })
  @ApiQuery({ name: 'onlyAvailable', required: false, type: Boolean })
  findByLocationVehicle(
    @Param('locationVehicleId') locationVehicleId: string,
    @Query('onlyAvailable') onlyAvailable?: string,
  ) {
    const onlyAvailableBool = onlyAvailable === 'true';
    return this.slotsService.findByLocationVehicle(locationVehicleId, onlyAvailableBool);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Szczegóły slotu' })
  findOne(@Param('id') id: string) {
    return this.slotsService.findOne(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Utwórz slot' })
  create(
    @Body() dto: CreateSlotDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.slotsService.create(dto, userId, userRole);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Edytuj slot' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSlotDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.slotsService.update(id, dto, userId, userRole);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Usuń slot' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.slotsService.remove(id, userId, userRole);
  }
}