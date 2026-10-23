import { chromeIsHuman, PUSH_TEMPLATES, SMS_TEMPLATES } from './template.seed';

describe('Nearo templates', () => {
  it('seeds AUTH_OTP sms copy', () => {
    expect(SMS_TEMPLATES).toEqual([
      {
        templateType: 'AUTH_OTP',
        body: '[CODE] is your Nearo code. It expires in [MINUTES] minutes.',
      },
    ]);
  });

  it('keeps push chrome human', () => {
    for (const row of PUSH_TEMPLATES) {
      expect(chromeIsHuman(row.title, row.body)).toBe(true);
    }
    expect(
      PUSH_TEMPLATES.find((row) => row.templateType === 'JOB_BROADCAST_HELPER'),
    ).toMatchObject({ channelId: 'nearo_jobs_loud', loud: true, title: 'New job nearby' });
  });
});
