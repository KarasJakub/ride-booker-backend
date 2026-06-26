import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'uuid-slotu' })
  @IsString()
  @IsNotEmpty()
  slotId!: string;

  @ApiPropertyOptional({ example: 'Chciałbym przetestować model na autostradzie.' })
  @IsOptional()
  @IsString()
  notes?: string;
}