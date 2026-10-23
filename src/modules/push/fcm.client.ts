import { existsSync, readFileSync } from 'fs';
import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type FirebaseMessaging = {
  sendEach: (messages: unknown[]) => Promise<{ successCount: number }>;
};

@Injectable()
export class FcmClient {
  private readonly logger = new Logger(FcmClient.name);
  private ready: boolean | null = null;
  private messaging: FirebaseMessaging | null = null;

  configured(): boolean {
    if (this.ready !== null) return this.ready;
    const file = this.configPath();
    if (!existsSync(file)) {
      this.ready = false;
      return false;
    }
    try {
      const json = JSON.parse(readFileSync(file, 'utf8')) as {
        private_key?: string;
        client_email?: string;
        project_id?: string;
      };
      const key = json.private_key ?? '';
      this.ready = Boolean(
        json.project_id &&
          json.client_email &&
          key.includes('BEGIN PRIVATE KEY') &&
          !key.includes('replace-me'),
      );
    } catch (err) {
      this.logger.warn(
        `FCM config unreadable: ${err instanceof Error ? err.message : err}`,
      );
      this.ready = false;
    }
    return this.ready;
  }

  configPath(): string {
    const folder =
      process.env.NODE_ENV === 'production' ? 'production' : 'development';
    return join(process.cwd(), 'static', folder, 'pushNotification.config.json');
  }

  async sendNative(messages: unknown[]): Promise<number> {
    if (!messages.length || !this.configured()) return 0;
    try {
      const messaging = await this.adminMessaging();
      if (!messaging) return 0;
      const batch = await messaging.sendEach(messages);
      return batch.successCount ?? 0;
    } catch (err) {
      this.logger.warn(
        `firebase push skipped: ${err instanceof Error ? err.message : err}`,
      );
      return 0;
    }
  }

  async sendExpo(messages: unknown[]): Promise<number> {
    if (!messages.length) return 0;
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) {
        this.logger.warn(`expo push HTTP ${response.status}`);
        return 0;
      }
      return messages.length;
    } catch (err) {
      this.logger.warn(
        `expo push skipped: ${err instanceof Error ? err.message : err}`,
      );
      return 0;
    }
  }

  private async adminMessaging(): Promise<FirebaseMessaging | null> {
    if (this.messaging) return this.messaging;
    const file = this.configPath();
    if (!existsSync(file)) return null;
    const serviceAccount = JSON.parse(readFileSync(file, 'utf8')) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };
    const loaded = (await import('firebase-admin')) as unknown as {
      default?: FirebaseAdmin;
      apps: { length: number };
      initializeApp: FirebaseAdmin['initializeApp'];
      credential: FirebaseAdmin['credential'];
      messaging: FirebaseAdmin['messaging'];
    };
    const admin = loaded.default ?? loaded;
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key,
        }),
      });
    }
    this.messaging = admin.messaging();
    return this.messaging;
  }
}

type FirebaseAdmin = {
  apps: { length: number };
  initializeApp: (options: unknown) => void;
  credential: { cert: (creds: unknown) => unknown };
  messaging: () => FirebaseMessaging;
};
