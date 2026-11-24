import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AssignVehicleDto {
  @ApiProperty({ example: 'location-uuid' })
  @IsString()
  locationId!: string;

  @ApiProperty({ example: 'vehicle-uuid' })
  @IsString()
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