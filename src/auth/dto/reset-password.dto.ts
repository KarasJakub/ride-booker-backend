import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'jan@kowalski.pl' })
  @IsEmail()
  email!: string;
}