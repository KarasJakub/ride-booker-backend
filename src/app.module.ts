import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { LocationsModule } from './locations/locations.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { InventoryModule } from './inventory/inventory.module';
import { SlotsModule } from './slots/slots.module';
import { BookingsModule } from './bookings/bookings.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    LocationsModule,
    VehiclesModule,
    InventoryModule,
    SlotsModule,
    BookingsModule,
  ],
})
export class AppModule {}