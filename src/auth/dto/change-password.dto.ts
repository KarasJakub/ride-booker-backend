import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'password' })
  @IsNotEmpty()
  @IsString()
  oldPassword!: string;

  @ApiProperty({ example: 'password' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword!: string;
}