import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Moje ulubione' })
  findMine(@CurrentUser('id') userId: string) {
    return this.favoritesService.findMine(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Dodaj do ulubionych' })
  add(@CurrentUser('id') userId: string, @Body('vehicleId') vehicleId: string) {
    return this.favoritesService.add(userId, vehicleId);
  }

  @Delete(':vehicleId')
  @ApiOperation({ summary: 'Usuń z ulubionych' })
  remove(@CurrentUser('id') userId: string, @Param('vehicleId') vehicleId: string) {
    return this.favoritesService.remove(userId, vehicleId);
  }
}