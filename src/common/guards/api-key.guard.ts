import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('apiKey', '');
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const header = req.headers['x-api-key'] ?? req.headers['api-key'];
    const got = Array.isArray(header) ? header[0] : header;
    if (!expected || got !== expected) {
      throw new UnauthorizedException('Invalid api key');
    }
    return true;
  }
}

export function apiKeyMatches(expected: string, got: unknown): boolean {
  return Boolean(expected) && typeof got === 'string' && got === expected;
}
