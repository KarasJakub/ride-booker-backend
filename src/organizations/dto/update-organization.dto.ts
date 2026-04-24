import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Yamaha Polska' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'kontakt@yamaha.pl' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+48123456789' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://yamaha.pl' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}