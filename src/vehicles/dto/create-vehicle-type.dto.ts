import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateVehicleTypeDto {
  @ApiProperty({ example: 'sport' })
  @IsNotEmpty()
  @IsString()
  name!: string;
}