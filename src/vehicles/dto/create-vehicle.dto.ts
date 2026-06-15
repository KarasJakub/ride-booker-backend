import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, IsUrl, Min } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'Yamaha MT-07' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'uuid-typu' })
  // @IsUUID()
  @IsString()
  typeId!: string;

  @ApiPropertyOptional({ example: 689 })
  @IsOptional()
  @IsInt()
  @Min(1)
  engineCapacity?: number;

  @ApiPropertyOptional({ example: 73 })
  @IsOptional()
  @IsInt()
  @Min(1)
  power?: number;

  @ApiPropertyOptional({ example: 'Kultowy naked z charakternym silnikiem.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/mt07.jpg' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}