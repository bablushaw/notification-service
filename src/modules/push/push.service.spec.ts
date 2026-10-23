import { PushService } from './push.service';

function harness(template?: {
  title: string;
  body: string;
  channelId: string;
  loud: boolean;
}) {
  const saved: Array<Record<string, unknown>> = [];
  const logs = {
    create: jest.fn((row: Record<string, unknown>) => row),
    save: jest.fn(async (row: Record<string, unknown>) => {
      saved.push(row);
      return row;
    }),
  };
  const templates = {
    getPush: jest.fn().mockResolvedValue(
      template ?? {
        title: 'New job nearby',
        body: 'A customer needs help nearby.',
        channelId: 'nearo_jobs_loud',
        loud: true,
      },
    ),
  };
  const resolve = jest.fn().mockResolvedValue(['native-1']);
  const sendNative = jest.fn().mockResolvedValue(1);
  const sendExpo = jest.fn().mockResolvedValue(1);
  const service = new PushService(
    templates as never,
    { resolve } as never,
    {} as never,
    logs as never,
  );
  return { service, saved, resolve, sendNative, sendExpo, templates };
}

describe('PushService', () => {
  it('does not throw when FCM config is missing', async () => {
    const { service, saved, sendNative } = harness();
    await expect(
      service.send(
        {
          templateType: 'JOB_BROADCAST_HELPER',
          data: { deviceTokens: ['native-token'] },
        },
        { configured: () => false, sendNative, sendExpo: jest.fn() },
      ),
    ).resolves.toBe(true);
    expect(sendNative).not.toHaveBeenCalled();
    expect(saved).toEqual([
      expect.objectContaining({
        status: 'SKIPPED',
        templateType: 'JOB_BROADCAST_HELPER',
        channelId: 'nearo_jobs_loud',
      }),
    ]);
  });

  it('interpolates AUTH_OTP [CODE]', async () => {
    const { service, saved, sendNative } = harness({
      title: 'Your Nearo code',
      body: '[CODE] expires in [MINUTES] min',
      channelId: 'nearo_otp',
      loud: false,
    });
    await service.send(
      {
        templateType: 'AUTH_OTP',
        templateVariables: { CODE: '123456', MINUTES: '5' },
        data: { deviceTokens: ['native-token'], kind: 'OTP' },
      },
      { configured: () => true, sendNative, sendExpo: jest.fn() },
    );
    expect(sendNative.mock.calls[0][0][0].notification).toEqual({
      title: 'Your Nearo code',
      body: '123456 expires in 5 min',
    });
    expect(saved[0]).toMatchObject({ status: 'SENT', body: '123456 expires in 5 min' });
  });

  it('expands recipientUserRoleIds into one message per token', async () => {
    const { service, resolve, sendNative } = harness({
      title: 'Helper assigned',
      body: 'A helper accepted your request.',
      channelId: 'nearo_jobs',
      loud: false,
    });
    resolve.mockResolvedValue(['tok-a', 'tok-b']);
    await service.send(
      {
        templateType: 'JOB_ASSIGNED_CUSTOMER',
        data: { recipientUserRoleIds: ['role-1', 'role-2'], jobId: 'job-1' },
      },
      { configured: () => true, sendNative, sendExpo: jest.fn() },
    );
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({ recipientUserRoleIds: ['role-1', 'role-2'] }),
    );
    expect(sendNative.mock.calls[0][0]).toHaveLength(2);
  });

  it('sends JOB_BROADCAST_HELPER on nearo_jobs_loud', async () => {
    const { service, sendNative } = harness();
    await service.send(
      {
        templateType: 'JOB_BROADCAST_HELPER',
        data: { deviceTokens: ['native-token'], event: 'BROADCAST' },
      },
      { configured: () => true, sendNative, sendExpo: jest.fn() },
    );
    const message = sendNative.mock.calls[0][0][0];
    expect(message.android.notification.channelId).toBe('nearo_jobs_loud');
    expect(message.android.priority).toBe('high');
    expect(message.apns.payload.aps['interruption-level']).toBe('time-sensitive');
  });
});
