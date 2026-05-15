import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum BookingStatusAction {
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatusAction })
  @IsEnum(BookingStatusAction)
  status!: BookingStatusAction;
}