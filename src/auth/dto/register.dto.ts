import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'jan@kowalski.pl' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Haslo123!' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ example: 'Jan Kowalski' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: '+48123456789' })
  @IsOptional()
  @IsString()
  phone?: string;
}