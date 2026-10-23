import { IsObject, IsOptional, IsString } from 'class-validator';

export class NotificationEventDto {
  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  roleName?: string;

  @IsString()
  templateType!: string;

  @IsOptional()
  @IsObject()
  templateVariables?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
