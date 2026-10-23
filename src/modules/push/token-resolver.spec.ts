import { TokenResolver } from './token-resolver';

describe('TokenResolver', () => {
  it('expands recipientUserRoleIds with one SQL lookup', async () => {
    const query = jest.fn().mockResolvedValue([{ token: 't1' }, { token: 't2' }]);
    const resolver = new TokenResolver({ query } as never);
    await expect(
      resolver.resolve({ recipientUserRoleIds: ['id-a', 'id-b'] }),
    ).resolves.toEqual(['t1', 't2']);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][1]).toEqual([['id-a', 'id-b']]);
  });

  it('prefers explicit deviceTokens', async () => {
    const query = jest.fn();
    const resolver = new TokenResolver({ query } as never);
    await expect(
      resolver.resolve({
        deviceTokens: ['ExponentPushToken[abc]'],
        recipientUserRoleIds: ['id-a'],
      }),
    ).resolves.toEqual(['ExponentPushToken[abc]']);
    expect(query).not.toHaveBeenCalled();
  });
});
