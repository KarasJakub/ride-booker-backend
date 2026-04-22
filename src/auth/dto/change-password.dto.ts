import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'StareHaslo123!' })
  @IsNotEmpty()
  @IsString()
  oldPassword!: string;

  @ApiProperty({ example: 'NoweHaslo123!' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword!: string;
}