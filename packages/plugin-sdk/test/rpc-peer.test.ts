import { describe, expect, it } from 'vitest';

import { RpcPeer } from '@plugin-sdk/rpc-peer';

describe('RpcPeer', () => {
  it('round-trips requests across a real MessageChannel', async () => {
    const channel = new MessageChannel();
    const client = new RpcPeer(channel.port1);
    const server = new RpcPeer(channel.port2);
    server.expose('sum', (payload) => {
      const values = payload as number[];
      return values.reduce((total, value) => total + value, 0);
    });

    await expect(client.request('sum', [4, 5, 6])).resolves.toBe(15);
    client.dispose();
    server.dispose();
  });

  it('propagates remote handler errors', async () => {
    const channel = new MessageChannel();
    const client = new RpcPeer(channel.port1);
    const server = new RpcPeer(channel.port2);
    server.expose('fail', () => {
      throw new RangeError('Invalid range');
    });

    await expect(client.request('fail')).rejects.toMatchObject({
      message: 'Invalid range',
      name: 'RangeError',
    });
    client.dispose();
    server.dispose();
  });
});
