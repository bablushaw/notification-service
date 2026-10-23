export type PushEnvelope = {
  token: string;
  title: string;
  body: string;
  channelId: string;
  loud: boolean;
  data: Record<string, string>;
};

export function channelFor(
  templateType: string,
  templateChannel?: string | null,
): { channelId: string; loud: boolean } {
  if (templateType === 'JOB_BROADCAST_HELPER') {
    return { channelId: 'nearo_jobs_loud', loud: true };
  }
  if (templateType === 'AUTH_OTP') {
    return { channelId: 'nearo_otp', loud: false };
  }
  return { channelId: templateChannel || 'nearo_jobs', loud: false };
}

export function isExpoToken(token: string): boolean {
  return token.startsWith('ExponentPushToken[');
}

/** FCM data values must be strings. Chrome stays in notification title/body. */
export function stringData(
  input: Record<string, unknown> | undefined,
  extras: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = { ...extras };
  if (!input) return out;
  for (const key of [
    'jobId',
    'status',
    'event',
    'kind',
    'templateType',
    'phone',
    'mobileNumber',
    'countryCode',
    'roleName',
    'channelId',
  ]) {
    const value = input[key];
    if (typeof value === 'string' && value) out[key] = value;
  }
  return out;
}

export function fcmMessage(envelope: PushEnvelope): Record<string, unknown> {
  const channelId = envelope.loud ? 'nearo_jobs_loud' : envelope.channelId;
  const aps: Record<string, unknown> = { sound: 'default' };
  if (envelope.loud) aps['interruption-level'] = 'time-sensitive';
  return {
    token: envelope.token,
    notification: { title: envelope.title, body: envelope.body },
    data: { ...envelope.data, channelId, templateType: envelope.data.templateType ?? '' },
    android: {
      priority: 'high',
      notification: { channelId, sound: 'default' },
    },
    apns: envelope.loud
      ? { headers: { 'apns-priority': '10' }, payload: { aps } }
      : { payload: { aps } },
  };
}

export function expoMessage(envelope: PushEnvelope): Record<string, unknown> {
  const channelId = envelope.loud ? 'nearo_jobs_loud' : envelope.channelId;
  return {
    to: envelope.token,
    title: envelope.title,
    body: envelope.body,
    sound: 'default',
    channelId,
    priority: 'high',
    data: { ...envelope.data, channelId },
    ...(envelope.loud ? { interruptionLevel: 'time-sensitive' } : {}),
  };
}
