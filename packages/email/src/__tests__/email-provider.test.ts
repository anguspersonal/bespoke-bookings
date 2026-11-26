import { describe, expect, it, vi } from 'vitest';
import { DemoEmailProvider, PostalClient } from '../index';

describe('DemoEmailProvider', () => {
  it('captures sent messages in memory with deterministic mock IDs', async () => {
    const provider = new DemoEmailProvider();

    const first = await provider.sendEmail({
      to: 'client1@example.com',
      subject: 'Booking Confirmed',
      html: '<p>Confirmed</p>',
    });
    const second = await provider.sendEmail({
      to: 'client2@example.com',
      subject: 'Booking Reminder',
      html: '<p>See you soon</p>',
      from: 'bookings@crownandblade.example',
    });

    expect(first.messageId).toBe('demo_msg_0001');
    expect(first.provider).toBe('demo');
    expect(first.accepted).toBe(true);
    expect(second.messageId).toBe('demo_msg_0002');
    expect(provider.getSentMessages()).toHaveLength(2);
    expect(provider.getSentMessages()[1].message.from).toBe('bookings@crownandblade.example');

    provider.clearSentMessages();
    expect(provider.getSentMessages()).toHaveLength(0);
  });

  it('returns deterministic demo DKIM/SPF records for custom domains', async () => {
    const provider = new DemoEmailProvider();
    const records = await provider.registerCustomDomain('CrownAndBlade.example');

    expect(records.domain).toBe('crownandblade.example');
    expect(records.dkimRecordName).toContain('crownandblade.example');
    expect(records.dkimTxtRecord).toContain('v=DKIM1');
    expect(records.spfTxtRecord).toContain('v=spf1');
    expect(records.isVerified).toBe(false);
  });
});

describe('PostalClient', () => {
  it('falls back cleanly to demo mode when apiUrl/apiKey are unconfigured', async () => {
    const client = new PostalClient({ apiUrl: '', apiKey: '' });
    expect(client.isConfigured).toBe(false);

    const result = await client.sendEmail({
      to: 'client@example.com',
      subject: 'Fallback Test',
      html: '<p>Hello</p>',
    });
    expect(result.provider).toBe('demo');
    expect(result.messageId).toBe('demo_msg_0001');
  });

  it('dispatches HTTP POST to Postal /api/v1/send/message when configured', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: { message_id: 'postal_live_98765' },
      }),
    }) as unknown as typeof fetch;

    const client = new PostalClient({
      apiUrl: 'https://postal.crownandblade.example',
      apiKey: 'test-server-key',
      fetchImpl: mockFetch,
    });

    expect(client.isConfigured).toBe(true);
    const result = await client.sendEmail({
      to: 'client@example.com',
      subject: 'Live Dispatch',
      html: '<p>Booked</p>',
    });

    expect(result.provider).toBe('postal');
    expect(result.messageId).toBe('postal_live_98765');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://postal.crownandblade.example/api/v1/send/message',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-Server-API-Key': 'test-server-key' }),
      }),
    );
  });
});
