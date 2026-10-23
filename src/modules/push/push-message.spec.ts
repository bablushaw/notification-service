import { channelFor, expoMessage, fcmMessage } from './push-message';

describe('push message', () => {
  it('JOB_BROADCAST_HELPER uses the loud channel and time-sensitive APNs', () => {
    expect(channelFor('JOB_BROADCAST_HELPER', 'nearo_jobs')).toEqual({
      channelId: 'nearo_jobs_loud',
      loud: true,
    });
    const message = fcmMessage({
      token: 'native-token',
      title: 'New job nearby',
      body: 'A customer needs help nearby.',
      channelId: 'nearo_jobs_loud',
      loud: true,
      data: { templateType: 'JOB_BROADCAST_HELPER', jobId: 'job-1', event: 'BROADCAST' },
    });
    expect(message.android).toMatchObject({
      priority: 'high',
      notification: { channelId: 'nearo_jobs_loud', sound: 'default' },
    });
    expect(message.apns).toMatchObject({
      payload: { aps: { sound: 'default', 'interruption-level': 'time-sensitive' } },
    });
    expect(expoMessage({
      token: 'ExponentPushToken[abc]',
      title: 'New job nearby',
      body: 'A customer needs help nearby.',
      channelId: 'nearo_jobs_loud',
      loud: true,
      data: { templateType: 'JOB_BROADCAST_HELPER' },
    })).toMatchObject({
      channelId: 'nearo_jobs_loud',
      interruptionLevel: 'time-sensitive',
      sound: 'default',
    });
  });

  it('OTP uses nearo_otp and is not loud', () => {
    expect(channelFor('AUTH_OTP')).toEqual({ channelId: 'nearo_otp', loud: false });
  });
});
