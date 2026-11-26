import { afterEach, describe, expect, it } from 'vitest';
import {
  DemoAuthProvider,
  GCIPAuthProvider,
  GCIPConfigurationError,
  verifyGCIPToken,
} from '../index';

const originalAuthMode = process.env.BESPOKE_AUTH_MODE;
const originalProjectId = process.env.GCP_PROJECT_ID;
const originalPublicProjectId = process.env.NEXT_PUBLIC_GCP_PROJECT_ID;

afterEach(() => {
  process.env.BESPOKE_AUTH_MODE = originalAuthMode;
  process.env.GCP_PROJECT_ID = originalProjectId;
  process.env.NEXT_PUBLIC_GCP_PROJECT_ID = originalPublicProjectId;
});

describe('DemoAuthProvider', () => {
  it('returns null for empty or whitespace tokens', async () => {
    const provider = new DemoAuthProvider();
    expect(await provider.verifyToken('')).toBeNull();
    expect(await provider.verifyToken('   ')).toBeNull();
  });

  it('returns a deterministic demo owner user for non-empty tokens', async () => {
    const provider = new DemoAuthProvider();
    const user = await provider.verifyToken('demo-session-token');
    expect(user).toEqual({
      uid: 'demo_owner_001',
      email: 'owner@crownandblade.example',
      businessId: 'biz-crown-blade-001',
      role: 'owner',
      provider: 'demo',
    });
  });
});

describe('GCIPAuthProvider', () => {
  it('fails fast with GCIPConfigurationError when projectId is missing', () => {
    delete process.env.GCP_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_GCP_PROJECT_ID;
    expect(() => new GCIPAuthProvider()).toThrow(GCIPConfigurationError);
  });

  it('fails fast when verifyToken is called without a wired verifier callback', async () => {
    const provider = new GCIPAuthProvider({ projectId: 'bespoke-demo-gcp' });
    await expect(provider.verifyToken('some-jwt')).rejects.toThrow(GCIPConfigurationError);
  });

  it('delegates to injected verifier callback when configured', async () => {
    const provider = new GCIPAuthProvider({
      projectId: 'bespoke-demo-gcp',
      verifyIdToken: async (token) =>
        token === 'valid-jwt'
          ? {
              uid: 'gcip_123',
              email: 'manager@crownandblade.example',
              businessId: 'biz-crown-blade-001',
              role: 'manager',
            }
          : null,
    });

    expect(await provider.verifyToken('invalid-jwt')).toBeNull();
    expect(await provider.verifyToken('valid-jwt')).toEqual({
      uid: 'gcip_123',
      email: 'manager@crownandblade.example',
      businessId: 'biz-crown-blade-001',
      role: 'manager',
      provider: 'gcip',
    });
  });
});

describe('verifyGCIPToken backward-compatible helper', () => {
  it('uses DemoAuthProvider when BESPOKE_AUTH_MODE is not gcip', async () => {
    delete process.env.BESPOKE_AUTH_MODE;
    const user = await verifyGCIPToken('local-demo-token');
    expect(user?.provider).toBe('demo');
  });

  it('enforces GCIP configuration when BESPOKE_AUTH_MODE is gcip', async () => {
    process.env.BESPOKE_AUTH_MODE = 'gcip';
    delete process.env.GCP_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_GCP_PROJECT_ID;
    await expect(verifyGCIPToken('prod-token')).rejects.toThrow(GCIPConfigurationError);
  });
});
