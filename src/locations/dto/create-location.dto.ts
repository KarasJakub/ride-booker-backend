import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ example: 'Salon Yamaha Kraków' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Kraków' })
  @IsNotEmpty()
  @IsString()
  city!: string;

  @ApiPropertyOptional({ example: 'ul. Przykładowa 1' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '+48123456789' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 50.0614 })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: 19.9366 })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiProperty({ example: 'uuid-organizacji' })
  @IsUUID()
  organizationId!: string;
}