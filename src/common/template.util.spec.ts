import { interpolate } from './template.util';

describe('interpolate', () => {
  it('replaces AUTH_OTP [CODE] and [MINUTES]', () => {
    expect(
      interpolate(
        '[CODE] is your Nearo code. It expires in [MINUTES] minutes.',
        { CODE: '123456', MINUTES: '5' },
      ),
    ).toBe('123456 is your Nearo code. It expires in 5 minutes.');
  });

  it('leaves unknown tokens in place', () => {
    expect(interpolate('Hello [NAME]', {})).toBe('Hello [NAME]');
  });
});
