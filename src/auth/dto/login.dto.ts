import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'jan@kowalski.pl' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password' })
  @IsNotEmpty()
  @IsString()
  password!: string;
}