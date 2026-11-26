import React from 'react';

export const metadata = {
  title: 'Bespoke Bookings Platform',
  description: 'Embeddable booking engine & admin portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
