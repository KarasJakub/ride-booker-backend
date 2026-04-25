import {
  Body, Controller, Get, HttpCode,
  HttpStatus, Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking.dto';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Moje rezerwacje (user)' })
  findMine(@CurrentUser('id') userId: string) {
    return this.bookingsService.findMine(userId);
  }

  @Get('location/:locationId')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Rezerwacje w lokalizacji (admin)' })
  findByLocation(
    @Param('locationId') locationId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.bookingsService.findByLocation(locationId, userId, userRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Szczegóły rezerwacji' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.bookingsService.findOne(id, userId, userRole);
  }

  @Post()
  @ApiOperation({ summary: 'Utwórz rezerwację (user)' })
  create(
    @Body() dto: CreateBookingDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingsService.create(dto, userId);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Zmień status rezerwacji (admin)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.bookingsService.updateStatus(id, dto, userId, userRole);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Anuluj własną rezerwację (user)' })
  cancelMine(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingsService.cancelMine(id, userId);
  }
}