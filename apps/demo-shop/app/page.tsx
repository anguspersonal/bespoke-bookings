'use client';

import React, { useState, useEffect } from 'react';
import { DEMO_SERVICES, DEMO_BRANCHES } from '@bespoke/database';

export default function DemoShopHomePage() {
  const [selectedBranch, setSelectedBranch] = useState<'soho' | 'shoreditch'>('soho');
  const [widgetHeight, setWidgetHeight] = useState<number>(720);
  const [completedBooking, setCompletedBooking] = useState<{
    referenceCode: string;
    serviceName: string;
    customerName: string;
  } | null>(null);

  // Auto-resize listener for the embedded Bespoke Bookings widget iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data &&
        event.data.type === 'BESPOKE_RESIZE' &&
        typeof event.data.height === 'number'
      ) {
        setWidgetHeight(event.data.height);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Listen for the bespoke:booking_completed custom event emitted by widget.js
  useEffect(() => {
    const handleBookingDone = (e: Event) => {
      const detail = (
        e as CustomEvent<{
          referenceCode: string;
          serviceName: string;
          customerName: string;
        }>
      ).detail;
      if (detail) {
        setCompletedBooking({
          referenceCode: detail.referenceCode,
          serviceName: detail.serviceName,
          customerName: detail.customerName,
        });
        setTimeout(() => setCompletedBooking(null), 9000);
      }
    };

    window.addEventListener('bespoke:booking_completed', handleBookingDone);
    return () => window.removeEventListener('bespoke:booking_completed', handleBookingDone);
  }, []);

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-[#f4f4f5] font-sans selection:bg-[#d6af71] selection:text-black">
      {/* Live Booking Confirmation Toast */}
      {completedBooking && (
        <div className="fixed top-5 right-5 z-[9999999] bg-[#141417] border border-[#22c55e] text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-8 h-8 rounded-full bg-[#22c55e]/20 text-[#22c55e] flex items-center justify-center font-bold text-sm">
            ✓
          </div>
          <div>
            <div className="text-xs text-[#22c55e] font-bold uppercase tracking-wider">
              Booking Received!
            </div>
            <div className="text-sm font-semibold">
              Ref: <span className="text-[#d6af71]">{completedBooking.referenceCode}</span> for{' '}
              {completedBooking.customerName}
            </div>
            <div className="text-xs text-[#a1a1aa] mt-0.5">{completedBooking.serviceName}</div>
          </div>
          <button
            type="button"
            onClick={() => setCompletedBooking(null)}
            className="ml-2 text-[#71717a] hover:text-white text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner: Student & NHS discounts */}
      <div className="bg-[#18181c] border-b border-[#27272a] py-2 px-4 text-center text-xs tracking-wide text-[#a1a1aa] flex justify-center items-center gap-4 flex-wrap">
        <span>⭐ Over 500+ Five-Star Reviews</span>
        <span className="hidden sm:inline text-[#3f3f46]">•</span>
        <span className="text-[#d6af71] font-semibold">10% Off for Students & NHS Cardholders</span>
        <span className="hidden sm:inline text-[#3f3f46]">•</span>
        <span>Walk-ins always welcome in Soho & Shoreditch</span>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-50 bg-[#0c0c0e]/95 backdrop-blur-md border-b border-[#1f1f23] px-6 py-4 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="#" className="flex items-center gap-3">
            <img
              src="/crown-and-blade-logo.svg"
              alt="Crown & Blade Barbers Logo"
              className="h-10 object-contain"
            />
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#d4d4d8]">
            <a href="#booking" className="hover:text-[#d6af71] transition-colors">Book Online</a>
            <a href="#services" className="hover:text-[#d6af71] transition-colors">Services & Pricing</a>
            <a href="#branches" className="hover:text-[#d6af71] transition-colors">Locations</a>
            <a href="#reviews" className="hover:text-[#d6af71] transition-colors">Client Reviews</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#booking"
              className="hidden sm:inline-flex px-4 py-2 border border-[#27272a] hover:border-[#d6af71]/50 text-[#d4d4d8] hover:text-white font-medium text-xs rounded transition-colors"
            >
              View Calendar
            </a>
            <button
              type="button"
              data-bespoke-modal
              data-shop={selectedBranch}
              className="px-5 py-2.5 bg-[#d6af71] hover:bg-[#e6c48c] text-[#0f0f11] font-bold text-xs uppercase tracking-wider rounded transition-all shadow-lg shadow-[#d6af71]/10 flex items-center gap-1.5 cursor-pointer"
            >
              <span>⚡ Quick Book</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden border-b border-[#1a1a1e]">
        {/* Subtle gold radial background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#d6af71]/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#18181c] border border-[#2e2e38] text-xs font-semibold text-[#d6af71] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#d6af71] animate-pulse" />
            London&apos;s Independent Grooming & Barbering House
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 uppercase leading-tight">
            Sharp Cuts. <br className="hidden sm:block" />
            <span className="text-[#d6af71]">Traditional Blade.</span> Pure Craftsmanship.
          </h1>

          <p className="text-lg sm:text-xl text-[#a1a1aa] mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Independent London barbers specializing in precision scissor work, seamless skin fades,
            steam hot towel treatments, and crisp razor finishes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              data-bespoke-modal
              data-shop={selectedBranch}
              className="w-full sm:w-auto px-8 py-4 bg-[#d6af71] hover:bg-[#e6c48c] text-[#0f0f11] font-bold text-sm uppercase tracking-wider rounded transition-all shadow-xl shadow-[#d6af71]/20 hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>⚡ Quick Book (Popup Modal)</span>
            </button>
            <a
              href="#booking"
              className="w-full sm:w-auto px-8 py-4 bg-[#18181c] hover:bg-[#222228] text-white border border-[#2e2e38] font-bold text-sm uppercase tracking-wider rounded transition-all text-center"
            >
              Inline Booking Form ↓
            </a>
          </div>

          {/* Quick branch location badge row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-14 max-w-2xl mx-auto text-left">
            <div className="p-4 rounded-lg bg-[#141417] border border-[#222227] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#d6af71] uppercase tracking-wider">Crown & Blade — Soho</span>
                <p className="text-sm font-medium text-white m-0">14 Brewer Lane, W1F 0XX</p>
                <span className="text-xs text-[#71717a]">Heart of Soho, Mon–Fri</span>
              </div>
              <a href="tel:02079460101" className="text-xs text-[#d6af71] hover:underline font-medium">
                020 7946 0101
              </a>
            </div>

            <div className="p-4 rounded-lg bg-[#141417] border border-[#222227] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#d6af71] uppercase tracking-wider">Crown & Blade — Shoreditch</span>
                <p className="text-sm font-medium text-white m-0">88 Redchurch Mews, E2 7XX</p>
                <span className="text-xs text-[#71717a]">Open 7 Days a week</span>
              </div>
              <a href="tel:02079460202" className="text-xs text-[#d6af71] hover:underline font-medium">
                020 7946 0202
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* EMBEDDED BOOKING ENGINE SECTION (Replacing Fresha) */}
      <section id="booking" className="py-20 px-4 bg-[#08080a] relative">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#18181c] border border-[#27272a] text-xs font-semibold text-[#d6af71] uppercase tracking-widest mb-3">
              Direct Reservation System
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase">
              Book Your Appointment
            </h2>
            <p className="text-[#a1a1aa] text-sm mt-2 max-w-md mx-auto">
              Select your service, preferred barber, and date below. Instant confirmation with zero platform commission.
            </p>

            {/* Branch Switcher for the widget */}
            <div className="inline-flex items-center bg-[#151518] p-1.5 rounded-lg border border-[#27272a] mt-6">
              <button
                type="button"
                onClick={() => setSelectedBranch('soho')}
                className={`px-5 py-2 text-xs font-bold uppercase rounded-md transition-all ${
                  selectedBranch === 'soho'
                    ? 'bg-[#d6af71] text-[#0f0f11] shadow'
                    : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                Soho (Brewer Ln)
              </button>
              <button
                type="button"
                onClick={() => setSelectedBranch('shoreditch')}
                className={`px-5 py-2 text-xs font-bold uppercase rounded-md transition-all ${
                  selectedBranch === 'shoreditch'
                    ? 'bg-[#d6af71] text-[#0f0f11] shadow'
                    : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                Shoreditch (Redchurch Mews)
              </button>
            </div>
          </div>

          {/* Embedded Bespoke Booking Iframe Container */}
          <div className="relative rounded-xl overflow-hidden border border-[#27272a] shadow-2xl bg-[#0f0f11]">
            <iframe
              src={`${process.env.NEXT_PUBLIC_PLATFORM_URL || 'http://localhost:3000'}/embed/${selectedBranch}`}
              style={{
                width: '100%',
                height: `${widgetHeight}px`,
                border: 'none',
                display: 'block',
                transition: 'height 0.2s ease-out',
              }}
              title="Bespoke Bookings Embed"
              scrolling="no"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#71717a] mt-4 px-2">
            <span>🛡️ SSL Encrypted • Zero booking fees</span>
            <span>Pay in shop upon arrival</span>
          </div>
        </div>
      </section>

      {/* SERVICES & PRICING GRID */}
      <section id="services" className="py-24 px-6 border-t border-[#1a1a1e] bg-[#0c0c0e]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#d6af71] mb-2">
              Our Service Menu
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white uppercase tracking-tight">
              Craftsmanship & Grooming Packages
            </h3>
            <p className="text-[#a1a1aa] max-w-xl mx-auto mt-3 text-sm">
              All haircuts and beard services include our signature hot towel treatment,
              razor neckline finish, and soothing cooling balm.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {DEMO_SERVICES.map((svc) => (
              <div
                key={svc.id}
                className="group bg-[#141417] border border-[#222227] hover:border-[#d6af71]/50 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-[#d6af71]/5"
              >
                <div className="relative h-44 w-full overflow-hidden bg-[#1f1f23]">
                  <img
                    src={svc.imageUrl || '/services/haircut.svg'}
                    alt={svc.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-[#0c0c0e]/85 backdrop-blur-sm px-2.5 py-1 rounded text-xs font-bold text-[#d6af71] border border-[#27272a]">
                    £{(svc.priceInPence / 100).toFixed(0)}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-lg text-white mb-1 group-hover:text-[#d6af71] transition-colors">
                      {svc.name}
                    </h4>
                    {svc.subTitle && (
                      <span className="text-xs text-[#a1a1aa] font-medium block mb-2">
                        {svc.subTitle}
                      </span>
                    )}
                    <p className="text-xs text-[#71717a] line-clamp-3 leading-relaxed">
                      {svc.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#1f1f23] flex items-center justify-between">
                    <span className="text-xs text-[#8e8e99] font-medium">⏱️ {svc.durationMinutes} mins</span>
                    <button
                      type="button"
                      data-bespoke-modal
                      data-shop={selectedBranch}
                      data-service={svc.id}
                      className="text-xs font-bold text-[#d6af71] hover:text-[#f3d399] uppercase tracking-wide cursor-pointer bg-transparent border-none p-0 flex items-center gap-1 transition-colors"
                    >
                      Book Service →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLIENT REVIEWS SECTION */}
      <section id="reviews" className="py-20 px-6 bg-[#09090b] border-t border-[#1a1a1e]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-1 text-[#d6af71] text-lg mb-2">
              ★★★★★
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
              Praised by Gentlemen Across London
            </h3>
            <p className="text-xs text-[#a1a1aa] mt-1">4.9 / 5.0 Average Client Rating</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#121215] border border-[#222227] flex flex-col justify-between">
              <p className="text-sm text-[#d4d4d8] leading-relaxed italic mb-4">
                &ldquo;Arthur is hands down the best barber in central London. The attention to detail on the skin fade
                and the traditional hot towel wet shave is second to none.&rdquo;
              </p>
              <div>
                <strong className="text-sm text-white block">Alex M.</strong>
                <span className="text-xs text-[#d6af71]">Soho Client • Verified Review</span>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#121215] border border-[#222227] flex flex-col justify-between">
              <p className="text-sm text-[#d4d4d8] leading-relaxed italic mb-4">
                &ldquo;The Chief Executive package is pure luxury. You get hair cut, beard styling, double wash,
                hot towel, and massage. Feel like a new man every time I leave.&rdquo;
              </p>
              <div>
                <strong className="text-sm text-white block">David H.</strong>
                <span className="text-xs text-[#d6af71]">Shoreditch Client • Verified Review</span>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#121215] border border-[#222227] flex flex-col justify-between">
              <p className="text-sm text-[#d4d4d8] leading-relaxed italic mb-4">
                &ldquo;Super clean shop, great coffee, and punctual bookings. The online booking system makes it
                effortless to get an appointment during lunch break.&rdquo;
              </p>
              <div>
                <strong className="text-sm text-white block">James K.</strong>
                <span className="text-xs text-[#d6af71]">Soho Client • Verified Review</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOCATIONS & OPENING HOURS */}
      <section id="branches" className="py-20 px-6 bg-[#0c0c0e] border-t border-[#1a1a1e]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#d6af71] mb-2">
              Visit Our Barbershops
            </h2>
            <h3 className="text-3xl font-extrabold text-white uppercase tracking-tight">
              Two Central London Locations
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {DEMO_BRANCHES.map((branch) => (
              <div
                key={branch.id}
                className="p-8 rounded-xl bg-[#121215] border border-[#222227]"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-white">{branch.name}</h4>
                  <span className="px-2.5 py-1 rounded bg-[#d6af71]/15 text-[#d6af71] text-xs font-bold uppercase">
                    Walk-ins Welcome
                  </span>
                </div>

                <div className="space-y-2 text-sm text-[#a1a1aa] mb-6">
                  <p className="m-0">📍 {branch.addressLine1}, London {branch.postalCode}</p>
                  <p className="m-0">
                    📞 Telephone:{' '}
                    <a href={`tel:${branch.phone.replace(/\s+/g, '')}`} className="text-white hover:text-[#d6af71]">
                      {branch.phone}
                    </a>
                  </p>
                </div>

                <div className="pt-4 border-t border-[#1f1f23]">
                  <strong className="text-xs uppercase tracking-wider text-[#71717a] block mb-2">
                    Opening Hours:
                  </strong>
                  <ul className="text-xs text-[#a1a1aa] space-y-1">
                    <li className="flex justify-between">
                      <span>Monday – Friday:</span>
                      <span className="text-white font-medium">9:00 am – 7:00 pm</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Saturday:</span>
                      <span className="text-white font-medium">
                        {branch.openingHours.saturday.closed ? 'Closed' : `${branch.openingHours.saturday.open} – ${branch.openingHours.saturday.close}`}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Sunday:</span>
                      <span className="text-white font-medium">
                        {branch.openingHours.sunday.closed ? 'Closed' : `${branch.openingHours.sunday.open} – ${branch.openingHours.sunday.close}`}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 bg-[#08080a] border-t border-[#18181c] text-center text-xs text-[#71717a]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="m-0">
            © 2026 CROWN & BLADE BARBERS • Fictional Demo Storefront
          </p>
          <p className="m-0">
            Powered by <span className="text-[#d6af71] font-semibold">Bespoke Bookings</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
