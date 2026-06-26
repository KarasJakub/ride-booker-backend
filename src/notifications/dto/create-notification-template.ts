import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export enum NotificationEventTypeDto {
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_REJECTED = 'BOOKING_REJECTED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

export enum NotificationRecipientTypeDto {
  USER = 'USER',
  BRANCH_ADMIN = 'BRANCH_ADMIN',
}

export class CreateNotificationTemplateDto {
  @ApiProperty({ enum: NotificationEventTypeDto })
  @IsEnum(NotificationEventTypeDto)
  eventType!: NotificationEventTypeDto;

  @ApiProperty({ enum: NotificationRecipientTypeDto })
  @IsEnum(NotificationRecipientTypeDto)
  recipient!: NotificationRecipientTypeDto;

  @ApiProperty({ example: 'Twoja rezerwacja została potwierdzona' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Cześć {username}, Twoja rezerwacja na {model_motocykla} została potwierdzona.' })
  @IsString()
  bodyHtml!: string;

  @ApiPropertyOptional({ example: 'uuid-lokalizacji', description: 'Pomiń dla szablonu globalnego' })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}