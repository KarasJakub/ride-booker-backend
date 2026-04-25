import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class AssignVehicleDto {
  @ApiProperty({ example: 'location-uuid' })
  @IsUUID()
  locationId!: string;

  @ApiProperty({ example: 'vehicle-uuid' })
  @IsUUID()
  vehicleId!: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}