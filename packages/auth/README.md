# `@bespoke/auth`

Pluggable authentication adapter package for the Bespoke Bookings admin portal (`/admin` and `/api/v1/admin/*`).

## Adapter Pattern

All authentication implementations conform to the `AuthProvider` interface:

```ts
import type { AuthProvider, VerifiedUser } from '@bespoke/auth';
```

- **`DemoAuthProvider`** — Explicit local development & portfolio demo adapter. Accepts any non-empty bearer token and returns a deterministic demo owner session (`Crown & Blade Barbers`). Never use in production.
- **`GCIPAuthProvider`** — Production contract for [Google Cloud Identity Platform](https://cloud.google.com/identity-platform) (50,000 free MAUs). Fails fast with `GCIPConfigurationError` if instantiated without `GCP_PROJECT_ID` or invoked without a wired JWT verifier (`verifyIdToken`), preventing accidental silent auth bypasses.

## Local Demo Mode

By default (`BESPOKE_AUTH_MODE` unset or `'demo'`), `createAuthProvider()` and the backward-compatible `verifyGCIPToken(idToken)` helper delegate to `DemoAuthProvider`:

```ts
import { createAuthProvider } from '@bespoke/auth';

const auth = createAuthProvider(); // DemoAuthProvider when BESPOKE_AUTH_MODE !== 'gcip'
const user = await auth.verifyToken(token);
```

## Production Wiring (GCIP)

Set `BESPOKE_AUTH_MODE=gcip` and `GCP_PROJECT_ID=<your-project-id>`, then inject a JWT verification adapter (for example using `google-auth-library` or `firebase-admin`) into `new GCIPAuthProvider({ projectId, verifyIdToken })`.
