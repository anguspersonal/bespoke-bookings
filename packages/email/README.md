# `@bespoke/email`

Pluggable transactional email adapter package for booking confirmations, reminders, and multi-tenant custom-domain DNS verification.

## Adapter Pattern

All email implementations conform to the `EmailProvider` interface:

- **`DemoEmailProvider`** — Local development & testing adapter that records sent messages in memory (`getSentMessages()`, `clearSentMessages()`) and returns deterministic mock message IDs (`demo_msg_0001`, ...).
- **`PostalClient`** — Adapter for self-hosted [Postal](https://github.com/postalserver/postal). When `POSTAL_API_URL` and `POSTAL_API_KEY` are configured, it dispatches real HTTP requests to `/api/v1/send/message` and `/api/v1/domains`. When unconfigured, it falls back cleanly to `DemoEmailProvider`.

## Custom-Domain DKIM / SPF Flow

Independent barbers do not need a paid Google Workspace account to send branded confirmations from `bookings@crownandblade.example`:

1. Call `provider.registerCustomDomain('crownandblade.example')` to retrieve the generated `dkimRecordName`, `dkimTxtRecord`, and `spfTxtRecord`.
2. The barber pastes those TXT records into their domain registrar.
3. Once verified, confirmations send directly from `bookings@crownandblade.example`. Before verification, emails fall back to `DEFAULT_FROM_EMAIL` with `Reply-To` set to the barber's inbox.

## Local Demo Mode

```ts
import { DemoEmailProvider } from '@bespoke/email';

const email = new DemoEmailProvider();
const result = await email.sendEmail({
  to: 'client@example.com',
  subject: 'Booking Confirmed — Crown & Blade Barbers',
  html: '<p>See you in Soho!</p>',
});
```
