import { PartialType } from '@nestjs/swagger';
import { CreateNotificationTemplateDto } from './create-notification-template';

export class UpdateNotificationTemplateDto extends PartialType(CreateNotificationTemplateDto) {}