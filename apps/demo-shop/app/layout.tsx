import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Crown & Blade Barbers — Traditional Barbering in Soho & Shoreditch',
  description:
    'Precision haircuts, skin fades, and hot towel wet shaves in Soho and Shoreditch, London. Book direct with zero booking fees.',
  icons: {
    icon: '/crown-and-blade-icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" className="scroll-smooth bg-[#0a0a0c] text-white">
      <body className="min-h-screen bg-[#0a0a0c] text-white antialiased">
        {children}
        {/* Bespoke Bookings Embed & Lightbox Widget */}
        <Script
          src={`${process.env.NEXT_PUBLIC_PLATFORM_URL || 'http://localhost:3000'}/widget.js`}
          strategy="afterInteractive"
          data-bespoke-host={process.env.NEXT_PUBLIC_PLATFORM_URL || 'http://localhost:3000'}
          data-bespoke-shop="soho"
          data-bespoke-floating="true"
        />
      </body>
    </html>
  );
}
