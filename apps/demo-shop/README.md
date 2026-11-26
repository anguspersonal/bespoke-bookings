# Crown & Blade Barbers — Demo Storefront

This app is a fictional demo barbershop storefront (**Crown & Blade Barbers**, Soho & Shoreditch, London) used to demonstrate how the **Bespoke Bookings** embeddable widget (`widget.js`) and isolated booking iframe integrate into an independent barber's existing website.

## Running Locally

From the monorepo root:

```bash
pnpm --filter @bespoke/demo-shop dev
```

This starts the demo storefront on `http://localhost:3001`, pointing at the local Bespoke Bookings platform (`http://localhost:3000` by default, configurable via `NEXT_PUBLIC_PLATFORM_URL`).
