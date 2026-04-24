import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { LocationsModule } from './locations/locations.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { InventoryModule } from './inventory/inventory.module';
import { SlotsModule } from './slots/slots.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    LocationsModule,
    OrganizationsModule,
    AuthModule,
    VehiclesModule,
    InventoryModule,
    SlotsModule,
  ],
})
export class AppModule {}