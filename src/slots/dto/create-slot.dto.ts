import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateSlotDto {
  @ApiProperty({ example: 'uuid-location-vehicle' })
  //@IsUUID()
  @IsNotEmpty()
  locationVehicleId!: string;

  @ApiProperty({ example: '2026-05-10T10:00:00.000Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ example: '2026-05-10T11:00:00.000Z' })
  @IsDateString()
  endTime!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}