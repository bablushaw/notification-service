import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

export type TokenQuery = {
  userId?: string;
  roleName?: string;
  recipientUserRoleIds?: string[];
  deviceTokens?: string[];
  countryCode?: string;
  mobileNumber?: string;
  deviceId?: string;
};

@Injectable()
export class TokenResolver {
  private readonly logger = new Logger(TokenResolver.name);

  constructor(private readonly db: DataSource) {}

  async resolve(input: TokenQuery): Promise<string[]> {
    const direct = unique(input.deviceTokens ?? []);
    if (direct.length) return direct;

    const roleIds = unique([
      ...(input.recipientUserRoleIds ?? []),
      ...(input.userId ? [input.userId] : []),
    ]);
    if (roleIds.length) {
      const fromRoles = await this.tokensForRoleIds(roleIds);
      if (fromRoles.length) return fromRoles;
    }

    if (input.countryCode && input.mobileNumber && input.roleName) {
      return this.tokensForPhone(
        input.countryCode,
        input.mobileNumber,
        input.roleName,
        input.deviceId,
      );
    }
    return [];
  }

  private async tokensForRoleIds(ids: string[]): Promise<string[]> {
    try {
      const rows = (await this.db.query(
        `SELECT d.fcm_token AS token
         FROM devices d
         INNER JOIN user_roles ur ON ur.account_id = d.account_id
         WHERE ur.id = ANY($1::uuid[])
           AND d.fcm_token IS NOT NULL
           AND d.fcm_token <> ''`,
        [ids],
      )) as Array<{ token?: string }>;
      return unique(rows.map((row) => row.token ?? ''));
    } catch (err) {
      this.logger.warn(
        `token lookup by user role failed: ${err instanceof Error ? err.message : err}`,
      );
      return [];
    }
  }

  private async tokensForPhone(
    countryCode: string,
    mobileNumber: string,
    role: string,
    deviceId?: string,
  ): Promise<string[]> {
    try {
      if (deviceId) {
        const exact = await this.phoneQuery(countryCode, mobileNumber, role, deviceId);
        if (exact.length) return exact;
      }
      return this.phoneQuery(countryCode, mobileNumber, role, undefined);
    } catch (err) {
      this.logger.warn(
        `token lookup by phone failed: ${err instanceof Error ? err.message : err}`,
      );
      return [];
    }
  }

  private async phoneQuery(
    countryCode: string,
    mobileNumber: string,
    role: string,
    deviceId?: string,
  ): Promise<string[]> {
    const rows = (await this.db.query(
      `SELECT fcm_token AS token
       FROM devices
       WHERE country_code = $1
         AND mobile_number = $2
         AND role = $3
         AND fcm_token IS NOT NULL
         AND fcm_token <> ''
         AND ($4::varchar IS NULL OR device_id = $4)`,
      [countryCode, mobileNumber, role, deviceId ?? null],
    )) as Array<{ token?: string }>;
    return unique(rows.map((row) => row.token ?? ''));
  }
}

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => (value ?? '').trim()).filter(Boolean))];
}
