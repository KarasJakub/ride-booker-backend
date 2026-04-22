import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsMobilePhone, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Jan Kowalski' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: '+48123456789' })
  @IsOptional()
  @IsMobilePhone()
  phone?: string;

  @ApiPropertyOptional({ example: 'nowy@email.pl' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Haslo123!' })
  @IsOptional()
  @IsString()
  password?: string; // wymagane tylko jeśli zmienia email
}