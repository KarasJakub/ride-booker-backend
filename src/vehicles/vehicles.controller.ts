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
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CreateVehicleTypeDto } from './dto/create-vehicle-type.dto';

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  // --- Vehicles types ---

  @Get('types')
  @ApiOperation({ summary: 'Lista typów pojazdów' })
  findAllTypes() {
    return this.vehiclesService.findAllTypes();
  }

  @Post('types')
  @Roles('SUPER_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Dodaj typ pojazdu (SUPER_ADMIN)' })
  createType(@Body() dto: CreateVehicleTypeDto) {
    return this.vehiclesService.createType(dto);
  }

  @Delete('types/:id')
  @Roles('SUPER_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Usuń typ pojazdu (SUPER_ADMIN)' })
  removeType(@Param('id') id: string) {
    return this.vehiclesService.removeType(id);
  }

  // --- Vehicles ---

  @Get()
  @ApiOperation({ summary: 'Lista pojazdów' })
  @ApiQuery({ name: 'typeId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @Query('typeId') typeId?: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBool = isActive !== undefined
      ? isActive === 'true'
      : undefined;
    return this.vehiclesService.findAll(typeId, isActiveBool);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Szczegóły pojazdu z dostępnymi lokalizacjami' })
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  @Roles('SUPER_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Dodaj pojazd (SUPER_ADMIN)' })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Edytuj pojazd (SUPER_ADMIN)' })
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Usuń pojazd (SUPER_ADMIN)' })
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }
}