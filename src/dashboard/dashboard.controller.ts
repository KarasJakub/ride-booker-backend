import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Statystyki dashboardu' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'locationId', required: false })
  getStats(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Query('organizationId') organizationId?: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.dashboardService.getStats(userId, userRole, organizationId, locationId);
  }

  @Get('location-comparison')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Porównanie lokalizacji (SUPER_ADMIN, ORG_ADMIN)' })
  @ApiQuery({ name: 'organizationId', required: false })
  getLocationComparison(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.dashboardService.getLocationComparison(userId, userRole, organizationId);
  }
}