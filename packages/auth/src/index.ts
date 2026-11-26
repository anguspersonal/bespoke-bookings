import type { StaffRole } from '@bespoke/types';

/**
 * Verified identity returned by any {@link AuthProvider} implementation.
 */
export interface VerifiedUser {
  uid: string;
  email: string;
  businessId: string;
  role: StaffRole;
  provider: 'demo' | 'gcip';
}

/**
 * Backward-compatible alias for {@link VerifiedUser}.
 */
export type AuthenticatedStaffSession = VerifiedUser;

/**
 * Pluggable authentication provider contract.
 *
 * Implementations verify bearer/session tokens for the admin portal (`/admin`
 * and `/api/v1/admin/*`) and return a tenant-scoped {@link VerifiedUser}.
 */
export interface AuthProvider {
  readonly name: string;
  verifyToken(idToken: string): Promise<VerifiedUser | null>;
}

export interface DemoAuthProviderOptions {
  uid?: string;
  email?: string;
  businessId?: string;
  role?: StaffRole;
}

/**
 * Explicit local demo-mode authentication provider.
 *
 * Intended strictly for local development, automated tests, and the public
 * portfolio demo. Accepts any non-empty bearer token and resolves to a
 * deterministic demo staff session for Crown & Blade Barbers.
 *
 * Do NOT use in production deployments.
 */
export class DemoAuthProvider implements AuthProvider {
  readonly name = 'demo';
  private readonly defaultUser: Omit<VerifiedUser, 'provider'>;

  constructor(options: DemoAuthProviderOptions = {}) {
    this.defaultUser = {
      uid: options.uid ?? 'demo_owner_001',
      email: options.email ?? 'owner@crownandblade.example',
      businessId: options.businessId ?? 'biz-crown-blade-001',
      role: options.role ?? 'owner',
    };
  }

  async verifyToken(idToken: string): Promise<VerifiedUser | null> {
    if (!idToken || !idToken.trim()) {
      return null;
    }

    return {
      ...this.defaultUser,
      provider: 'demo',
    };
  }
}

export type GCIPTokenVerifier = (
  idToken: string,
  config: { projectId: string; tenantId?: string },
) => Promise<Omit<VerifiedUser, 'provider'> | null>;

export interface GCIPAuthProviderConfig {
  /** Google Cloud project ID hosting Identity Platform. */
  projectId?: string;
  /** Optional GCIP multi-tenancy tenant ID. */
  tenantId?: string;
  /**
   * Optional token verification adapter (e.g., wrapping `google-auth-library`
   * or `firebase-admin` / Identity Platform Admin SDK).
   */
  verifyIdToken?: GCIPTokenVerifier;
}

/**
 * Error thrown when {@link GCIPAuthProvider} is instantiated or invoked without
 * required Google Cloud Identity Platform credentials or verifier wiring.
 */
export class GCIPConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GCIPConfigurationError';
  }
}

/**
 * Google Cloud Identity Platform (GCIP) authentication adapter contract.
 *
 * Fails fast with {@link GCIPConfigurationError} if required configuration or a
 * production JWT verifier callback is missing, rather than silently returning a
 * fake authenticated session.
 */
export class GCIPAuthProvider implements AuthProvider {
  readonly name = 'gcip';
  private readonly projectId: string;
  private readonly tenantId?: string;
  private readonly verifier?: GCIPTokenVerifier;

  constructor(config: GCIPAuthProviderConfig = {}) {
    const projectId =
      config.projectId ??
      process.env.GCP_PROJECT_ID ??
      process.env.NEXT_PUBLIC_GCP_PROJECT_ID;

    if (!projectId || !projectId.trim()) {
      throw new GCIPConfigurationError(
        'GCIPAuthProvider requires a GCP projectId (pass config.projectId or set GCP_PROJECT_ID). ' +
          'For local development without GCP credentials, use DemoAuthProvider or leave BESPOKE_AUTH_MODE unset.',
      );
    }

    this.projectId = projectId.trim();
    this.tenantId = config.tenantId ?? process.env.GCIP_TENANT_ID;
    this.verifier = config.verifyIdToken;
  }

  async verifyToken(idToken: string): Promise<VerifiedUser | null> {
    if (!idToken || !idToken.trim()) {
      return null;
    }

    if (!this.verifier) {
      throw new GCIPConfigurationError(
        `GCIPAuthProvider (project "${this.projectId}") is not wired to a JWT verifier. ` +
          'Supply a verifyIdToken adapter (e.g., using google-auth-library or firebase-admin) ' +
          'or use DemoAuthProvider for local development.',
      );
    }

    const verified = await this.verifier(idToken, {
      projectId: this.projectId,
      tenantId: this.tenantId,
    });

    if (!verified) {
      return null;
    }

    return {
      ...verified,
      provider: 'gcip',
    };
  }
}

export type AuthMode = 'demo' | 'gcip';

/**
 * Creates the configured {@link AuthProvider} based on `BESPOKE_AUTH_MODE`.
 * Defaults to `'demo'` for frictionless local development.
 */
export function createAuthProvider(mode?: AuthMode): AuthProvider {
  const resolvedMode: AuthMode =
    mode ?? (process.env.BESPOKE_AUTH_MODE === 'gcip' ? 'gcip' : 'demo');

  if (resolvedMode === 'gcip') {
    return new GCIPAuthProvider();
  }

  return new DemoAuthProvider();
}

const defaultDemoProvider = new DemoAuthProvider();

/**
 * Backward-compatible helper for verifying a staff session token.
 *
 * Delegates to {@link DemoAuthProvider} unless `BESPOKE_AUTH_MODE === 'gcip'`,
 * in which case it delegates to {@link GCIPAuthProvider} (which enforces real
 * configuration and verifier wiring).
 */
export async function verifyGCIPToken(
  idToken: string,
): Promise<AuthenticatedStaffSession | null> {
  if (process.env.BESPOKE_AUTH_MODE === 'gcip') {
    const provider = new GCIPAuthProvider();
    return provider.verifyToken(idToken);
  }

  return defaultDemoProvider.verifyToken(idToken);
}
