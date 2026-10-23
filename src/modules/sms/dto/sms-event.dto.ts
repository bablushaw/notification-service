import { IsObject, IsOptional, IsString } from 'class-validator';

export class SmsEventDto {
  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  templateType!: string;

  @IsOptional()
  @IsObject()
  templateVariables?: Record<string, unknown>;
}
