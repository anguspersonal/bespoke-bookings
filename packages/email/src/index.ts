/**
 * Transactional email payload accepted by any {@link EmailProvider}.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Backward-compatible alias for {@link EmailMessage}.
 */
export type SendEmailOptions = EmailMessage;

/**
 * Result returned after dispatching an email through an {@link EmailProvider}.
 */
export interface EmailSendResult {
  messageId: string;
  provider: 'demo' | 'postal';
  accepted: boolean;
  from: string;
  to: string;
}

/**
 * DNS records required to verify a barber's custom sending domain (DKIM/SPF)
 * so booking confirmations can be sent from `bookings@their-domain.example`
 * without requiring a paid Google Workspace seat.
 */
export interface DomainVerificationRecords {
  domain: string;
  dkimRecordName: string;
  dkimTxtRecord: string;
  spfTxtRecord: string;
  returnPathRecord?: string;
  isVerified: boolean;
}

/**
 * Backward-compatible alias for {@link DomainVerificationRecords}.
 */
export type PostalDomainRegistrationResult = DomainVerificationRecords;

/**
 * Pluggable transactional email provider contract.
 */
export interface EmailProvider {
  readonly name: string;
  sendEmail(message: EmailMessage): Promise<EmailSendResult>;
  registerCustomDomain(domain: string): Promise<DomainVerificationRecords>;
}

export interface RecordedEmail {
  messageId: string;
  sentAt: string;
  message: EmailMessage & { from: string };
}

export interface DemoEmailProviderOptions {
  defaultFrom?: string;
}

/**
 * Explicit local demo-mode email provider.
 *
 * Records all dispatched messages in memory for inspection and automated
 * testing, returning deterministic mock message IDs (`demo_msg_0001`, etc.)
 * and deterministic demo DKIM/SPF records.
 */
export class DemoEmailProvider implements EmailProvider {
  readonly name = 'demo';
  private readonly defaultFrom: string;
  private readonly sentMessages: RecordedEmail[] = [];
  private sequence = 0;

  constructor(options: DemoEmailProviderOptions = {}) {
    this.defaultFrom =
      options.defaultFrom ??
      process.env.DEFAULT_FROM_EMAIL ??
      'bookings@bespokebookings.example';
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    this.sequence += 1;
    const messageId = `demo_msg_${String(this.sequence).padStart(4, '0')}`;
    const from = message.from ?? this.defaultFrom;

    this.sentMessages.push({
      messageId,
      sentAt: new Date().toISOString(),
      message: { ...message, from },
    });

    return {
      messageId,
      provider: 'demo',
      accepted: true,
      from,
      to: message.to,
    };
  }

  async registerCustomDomain(domain: string): Promise<DomainVerificationRecords> {
    const normalized = domain.trim().toLowerCase();
    return {
      domain: normalized,
      dkimRecordName: `postal-demo._domainkey.${normalized}`,
      dkimTxtRecord:
        'v=DKIM1; k=rsa; p=DEMO_PUBLIC_KEY_PLACEHOLDER_NOT_FOR_PRODUCTION',
      spfTxtRecord: 'v=spf1 include:spf.postal.bespokebookings.example ~all',
      returnPathRecord: `rp.${normalized}`,
      isVerified: false,
    };
  }

  /** Returns a shallow copy of all messages recorded in memory. */
  getSentMessages(): ReadonlyArray<RecordedEmail> {
    return [...this.sentMessages];
  }

  /** Clears recorded messages and resets the deterministic message counter. */
  clearSentMessages(): void {
    this.sentMessages.length = 0;
    this.sequence = 0;
  }
}

export interface PostalClientConfig {
  apiUrl?: string;
  apiKey?: string;
  defaultFrom?: string;
  fetchImpl?: typeof fetch;
}

interface PostalSendApiResponse {
  status?: string;
  data?: {
    message_id?: string;
    messages?: Record<string, { id?: string | number }>;
  };
}

interface PostalDomainApiResponse {
  status?: string;
  data?: {
    dkim_record_name?: string;
    dkim_record?: string;
    spf_record?: string;
    return_path_domain?: string;
    verified?: boolean;
  };
}

/**
 * Self-hosted [Postal](https://github.com/postalserver/postal) transactional
 * email adapter implementing {@link EmailProvider}.
 *
 * - When `apiUrl` and `apiKey` are configured (via constructor or
 *   `POSTAL_API_URL` / `POSTAL_API_KEY`), dispatches real HTTP requests to the
 *   Postal REST API (`/api/v1/send/message` and `/api/v1/domains`).
 * - When unconfigured (e.g., local development or portfolio demo), gracefully
 *   falls back to an internal {@link DemoEmailProvider} so the app runs cleanly
 *   without a live mail server.
 */
export class PostalClient implements EmailProvider {
  readonly name = 'postal';
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly defaultFrom: string;
  private readonly fetchImpl: typeof fetch;
  private readonly fallback: DemoEmailProvider;

  constructor(config?: PostalClientConfig);
  constructor(apiUrl?: string, apiKey?: string, defaultFrom?: string);
  constructor(
    apiUrlOrConfig?: string | PostalClientConfig,
    apiKey?: string,
    defaultFrom?: string,
  ) {
    const config: PostalClientConfig =
      typeof apiUrlOrConfig === 'object' && apiUrlOrConfig !== null
        ? apiUrlOrConfig
        : { apiUrl: apiUrlOrConfig, apiKey, defaultFrom };

    this.apiUrl = (config.apiUrl ?? process.env.POSTAL_API_URL ?? '').replace(
      /\/+$/,
      '',
    );
    this.apiKey = config.apiKey ?? process.env.POSTAL_API_KEY ?? '';
    this.defaultFrom =
      config.defaultFrom ??
      process.env.DEFAULT_FROM_EMAIL ??
      'bookings@bespokebookings.example';
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.fallback = new DemoEmailProvider({ defaultFrom: this.defaultFrom });
  }

  /** True when both Postal API URL and server API key are present. */
  get isConfigured(): boolean {
    return Boolean(this.apiUrl && this.apiKey);
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    if (!this.isConfigured) {
      return this.fallback.sendEmail(message);
    }

    const from = message.from ?? this.defaultFrom;
    const response = await this.fetchImpl(`${this.apiUrl}/api/v1/send/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Server-API-Key': this.apiKey,
      },
      body: JSON.stringify({
        to: [message.to],
        from,
        reply_to: message.replyTo,
        subject: message.subject,
        html_body: message.html,
        plain_body: message.text,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Postal API send failed (${response.status} ${response.statusText})`,
      );
    }

    const payload = (await response.json()) as PostalSendApiResponse;
    const messageId =
      payload.data?.message_id ??
      String(Object.values(payload.data?.messages ?? {})[0]?.id ?? `postal_${Date.now()}`);

    return {
      messageId,
      provider: 'postal',
      accepted: payload.status !== 'error',
      from,
      to: message.to,
    };
  }

  async registerCustomDomain(domain: string): Promise<DomainVerificationRecords> {
    if (!this.isConfigured) {
      return this.fallback.registerCustomDomain(domain);
    }

    const normalized = domain.trim().toLowerCase();
    const response = await this.fetchImpl(`${this.apiUrl}/api/v1/domains`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Server-API-Key': this.apiKey,
      },
      body: JSON.stringify({ name: normalized }),
    });

    if (!response.ok) {
      throw new Error(
        `Postal API domain registration failed (${response.status} ${response.statusText})`,
      );
    }

    const payload = (await response.json()) as PostalDomainApiResponse;

    return {
      domain: normalized,
      dkimRecordName:
        payload.data?.dkim_record_name ?? `postal._domainkey.${normalized}`,
      dkimTxtRecord: payload.data?.dkim_record ?? '',
      spfTxtRecord: payload.data?.spf_record ?? '',
      returnPathRecord: payload.data?.return_path_domain,
      isVerified: Boolean(payload.data?.verified),
    };
  }
}

export type EmailMode = 'demo' | 'postal';

/**
 * Creates the configured {@link EmailProvider}.
 * Uses {@link PostalClient} when `BESPOKE_EMAIL_MODE === 'postal'` or when
 * `POSTAL_API_KEY` is set; otherwise returns {@link DemoEmailProvider}.
 */
export function createEmailProvider(mode?: EmailMode): EmailProvider {
  const resolvedMode: EmailMode =
    mode ??
    (process.env.BESPOKE_EMAIL_MODE === 'postal' || Boolean(process.env.POSTAL_API_KEY)
      ? 'postal'
      : 'demo');

  if (resolvedMode === 'postal') {
    return new PostalClient();
  }

  return new DemoEmailProvider();
}
