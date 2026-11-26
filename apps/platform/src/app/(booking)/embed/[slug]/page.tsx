'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  DEMO_BUSINESS,
  DEMO_BRANCHES,
  DEMO_SERVICES,
  DEMO_STAFF,
  getAvailableSlotsForDate,
} from '@bespoke/database';
import type { TimeSlot, BookingConfirmationDTO } from '@bespoke/types';

interface EmbedBookingPageProps {
  params: Promise<{ slug: string }>;
}

export default function EmbedBookingPage({ params }: EmbedBookingPageProps) {
  const [activeBranchSlug, setActiveBranchSlug] = useState<string>('soho');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(DEMO_SERVICES[0].id);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('staff-any');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to today in YYYY-MM-DD
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  
  // Client details
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [discountType, setDiscountType] = useState<'NONE' | 'STUDENT_10' | 'NHS_10'>('NONE');
  const [notes, setNotes] = useState<string>('');

  // Flow & State
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmationDTO | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const goToStep = (newStep: number) => {
    setStep(newStep);
    window.parent?.postMessage({ type: 'BESPOKE_STEP_CHANGE', step: newStep }, '*');
  };

  // Detect pre-selected service query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const preselectedService = sp.get('service');
      if (preselectedService && DEMO_SERVICES.some((s) => s.id === preselectedService)) {
        queueMicrotask(() => setSelectedServiceId(preselectedService));
      }
    }
  }, []);

  // Parse route slug
  useEffect(() => {
    params.then((p) => {
      if (p.slug === 'shoreditch') {
        setActiveBranchSlug('shoreditch');
      } else {
        setActiveBranchSlug('soho');
      }
    });
  }, [params]);

  // Height sync via postMessage to parent host website (WordPress, Squarespace, Webflow, etc.)
  useEffect(() => {
    const sendHeight = () => {
      if (!containerRef.current) return;
      const height = containerRef.current.offsetHeight + 40;
      window.parent.postMessage({ type: 'BESPOKE_RESIZE', height }, '*');
    };

    sendHeight();
    const observer = new ResizeObserver(sendHeight);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', sendHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sendHeight);
    };
  }, [step, confirmation, activeBranchSlug, selectedServiceId, selectedDate]);

  // Current branch & service
  const currentBranch = useMemo(() => {
    return DEMO_BRANCHES.find((b) => b.slug === activeBranchSlug) || DEMO_BRANCHES[0];
  }, [activeBranchSlug]);

  const currentService = useMemo(() => {
    return DEMO_SERVICES.find((s) => s.id === selectedServiceId) || DEMO_SERVICES[0];
  }, [selectedServiceId]);

  // Filter services by category
  const categories = ['All', 'Hair', 'Packages', 'Beard', 'Grooming'];
  const filteredServices = useMemo(() => {
    if (selectedCategory === 'All') return DEMO_SERVICES;
    return DEMO_SERVICES.filter((s) => s.category === selectedCategory);
  }, [selectedCategory]);

  // Generate next 7 dates
  const availableDates = useMemo(() => {
    const dates = [];
    const base = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(base.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' });
      const dayNum = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      dates.push({ iso, weekday, dayNum, isToday: i === 0 });
    }
    return dates;
  }, []);

  // Compute available slots
  const slots: TimeSlot[] = useMemo(() => {
    return getAvailableSlotsForDate(
      currentBranch.slug,
      selectedDate,
      selectedStaffId,
      currentService.durationMinutes
    );
  }, [currentBranch.slug, selectedDate, selectedStaffId, currentService.durationMinutes]);

  // Price calculations
  const basePrice = currentService.priceInPence / 100;
  const finalPrice = discountType !== 'NONE' ? Math.round(basePrice * 0.9) : basePrice;

  // Handle Booking Submission
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTimeSlot) {
      setErrorMessage('Please select an available time slot.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Please enter your full name and mobile phone number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug: DEMO_BUSINESS.slug,
          branchSlug: currentBranch.slug,
          serviceId: currentService.id,
          staffId: selectedStaffId,
          startsAt: selectedTimeSlot,
          customerName,
          customerEmail: customerEmail || `${customerPhone.replace(/\s+/g, '')}@noemail.bespoke`,
          customerPhone,
          notes,
          discountApplied: discountType === 'NONE' ? null : discountType,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete booking. Please try another slot.');
      }

      setConfirmation(data.booking);
      goToStep(5);

      // Dispatch booking event to parent host for analytics & conversion tracking
      window.parent?.postMessage(
        {
          type: 'BESPOKE_BOOKING_COMPLETED',
          booking: data.booking,
        },
        '*'
      );
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        maxWidth: '560px',
        margin: '0 auto',
        backgroundColor: '#0f0f11',
        color: '#ffffff',
        fontFamily: "'Oxygen', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif',",
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #222227',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(180deg, #18181c 0%, #0f0f11 100%)',
          borderBottom: '1px solid #26262c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <img
            src="/crown-and-blade-icon.svg"
            alt="Crown & Blade Barbers Logo"
            style={{ width: '42px', height: '42px', objectFit: 'contain' }}
          />
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '1.05rem',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: '#d6af71',
              }}
            >
              Crown &amp; Blade
            </h1>
            <span style={{ fontSize: '0.75rem', color: '#a1a1aa', letterSpacing: '0.5px' }}>
              London Barbers &amp; Grooming
            </span>
          </div>
        </div>

        {/* Branch Switcher Toggle */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#1f1f25',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid #2e2e38',
          }}
        >
          {DEMO_BRANCHES.map((b) => {
            const isActive = b.slug === activeBranchSlug;
            return (
              <button
                key={b.slug}
                type="button"
                onClick={() => {
                  setActiveBranchSlug(b.slug);
                  setSelectedTimeSlot('');
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: isActive ? '#d6af71' : 'transparent',
                  color: isActive ? '#0f0f11' : '#a1a1aa',
                }}
              >
                {b.name.replace('Crown & Blade — ', '')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Branch Address & Phone Bar */}
      <div
        style={{
          padding: '0.65rem 1.5rem',
          backgroundColor: '#141417',
          borderBottom: '1px solid #1f1f25',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: '#8e8e99',
        }}
      >
        <span>📍 {currentBranch.addressLine1}, {currentBranch.postalCode}</span>
        <a
          href={`tel:${currentBranch.phone.replace(/\s+/g, '')}`}
          style={{ color: '#d6af71', textDecoration: 'none', fontWeight: 600 }}
        >
          📞 {currentBranch.phone}
        </a>
      </div>

      {/* Main Flow Content */}
      <div style={{ padding: '1.5rem' }}>
        {/* Step Indicator */}
        {!confirmation && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            {[
              { num: 1, label: 'Service' },
              { num: 2, label: 'Barber' },
              { num: 3, label: 'Date & Time' },
              { num: 4, label: 'Details' },
            ].map((s) => {
              const isCurrent = step === s.num;
              const isPassed = step > s.num;
              return (
                <div
                  key={s.num}
                  onClick={() => s.num < step && goToStep(s.num)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: s.num < step ? 'pointer' : 'default',
                    opacity: isCurrent || isPassed ? 1 : 0.45,
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: isPassed ? '#22c55e' : isCurrent ? '#d6af71' : '#27272a',
                      color: isCurrent || isPassed ? '#0f0f11' : '#fff',
                    }}
                  >
                    {isPassed ? '✓' : s.num}
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: isCurrent ? 700 : 400, color: isCurrent ? '#d6af71' : '#ffffff' }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {/* STEP 1: CHOOSE SERVICE */}
        {step === 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 600 }}>1. Select Grooming Service</h2>
              <span style={{ fontSize: '0.8rem', color: '#d6af71' }}>Walk-ins also welcome</span>
            </div>

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    border: selectedCategory === cat ? '1px solid #d6af71' : '1px solid #2a2a32',
                    backgroundColor: selectedCategory === cat ? 'rgba(214, 175, 113, 0.15)' : '#18181c',
                    color: selectedCategory === cat ? '#d6af71' : '#a1a1aa',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Service List */}
            <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
              {filteredServices.map((svc) => {
                const isSelected = selectedServiceId === svc.id;
                return (
                  <div
                    key={svc.id}
                    onClick={() => setSelectedServiceId(svc.id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'rgba(214, 175, 113, 0.08)' : '#151518',
                      border: isSelected ? '1.5px solid #d6af71' : '1px solid #222227',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
                          {svc.name}
                        </span>
                        {svc.subTitle && (
                          <span style={{ fontSize: '0.75rem', color: '#8e8e99' }}>({svc.subTitle})</span>
                        )}
                      </div>
                      <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.8rem', color: '#a1a1aa', lineHeight: 1.4 }}>
                        {svc.description}
                      </p>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#71717a' }}>
                        <span>⏱️ {svc.durationMinutes} mins</span>
                        <span>•</span>
                        <span style={{ color: '#d6af71' }}>Traditional blade & flame</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#d6af71', display: 'block' }}>
                        £{(svc.priceInPence / 100).toFixed(0)}
                      </span>
                      <button
                        type="button"
                        style={{
                          marginTop: '0.5rem',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: isSelected ? '#d6af71' : '#27272a',
                          color: isSelected ? '#0f0f11' : '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {isSelected ? 'Selected' : 'Choose'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => goToStep(2)}
              style={{
                marginTop: '1.25rem',
                width: '100%',
                padding: '0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#d6af71',
                color: '#0f0f11',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              Next: Select Barber →
            </button>
          </div>
        )}

        {/* STEP 2: CHOOSE BARBER */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 600 }}>2. Select Your Barber</h2>
              <button
                type="button"
                onClick={() => goToStep(1)}
                style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                ← Back
              </button>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {DEMO_STAFF.map((staff) => {
                const isSelected = selectedStaffId === staff.id;
                return (
                  <div
                    key={staff.id}
                    onClick={() => setSelectedStaffId(staff.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'rgba(214, 175, 113, 0.08)' : '#151518',
                      border: isSelected ? '1.5px solid #d6af71' : '1px solid #222227',
                      cursor: 'pointer',
                    }}
                  >
                    <img
                      src={staff.avatarUrl || ''}
                      alt={staff.fullName}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{staff.fullName}</span>
                        {staff.id === 'staff-any' && (
                          <span style={{ fontSize: '0.7rem', backgroundColor: '#d6af71', color: '#0f0f11', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            Fastest Slot
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#a1a1aa' }}>
                        {staff.bio}
                      </p>
                    </div>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: isSelected ? '5px solid #d6af71' : '2px solid #3f3f46',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => goToStep(3)}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#d6af71',
                color: '#0f0f11',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              Next: Select Date & Time →
            </button>
          </div>
        )}

        {/* STEP 3: DATE & TIME SLOTS */}
        {step === 3 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 600 }}>3. Pick Date & Available Slot</h2>
              <button
                type="button"
                onClick={() => goToStep(2)}
                style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                ← Back
              </button>
            </div>

            {/* 7-Day Date Carousel */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                overflowX: 'auto',
                paddingBottom: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              {availableDates.map((d) => {
                const isSelected = selectedDate === d.iso;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => {
                      setSelectedDate(d.iso);
                      setSelectedTimeSlot('');
                    }}
                    style={{
                      flex: '0 0 auto',
                      minWidth: '65px',
                      padding: '0.6rem 0.5rem',
                      borderRadius: '8px',
                      border: isSelected ? '1.5px solid #d6af71' : '1px solid #222227',
                      backgroundColor: isSelected ? '#d6af71' : '#151518',
                      color: isSelected ? '#0f0f11' : '#ffffff',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, opacity: isSelected ? 0.9 : 0.6 }}>
                      {d.isToday ? 'Today' : d.weekday}
                    </span>
                    <strong style={{ display: 'block', fontSize: '0.9rem', marginTop: '2px' }}>
                      {d.dayNum}
                    </strong>
                  </button>
                );
              })}
            </div>

            {/* Slots Grid */}
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.5rem' }}>
              Available times for {currentBranch.name}:
            </label>

            {slots.length === 0 ? (
              <div
                style={{
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  backgroundColor: '#151518',
                  borderRadius: '8px',
                  border: '1px dashed #2e2e38',
                }}
              >
                <p style={{ margin: 0, color: '#fca5a5', fontSize: '0.9rem' }}>
                  🚫 This branch is closed on this day.
                </p>
                <p style={{ margin: '0.5rem 0 0 0', color: '#a1a1aa', fontSize: '0.8rem' }}>
                  Please choose another day or switch to our Shoreditch branch open 7 days a week.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.5rem',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {slots.map((slot) => {
                  const isSelected = selectedTimeSlot === slot.startsAt;
                  return (
                    <button
                      key={slot.timeString}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedTimeSlot(slot.startsAt)}
                      style={{
                        padding: '0.65rem 0.25rem',
                        borderRadius: '6px',
                        border: isSelected
                          ? '1.5px solid #d6af71'
                          : slot.available
                          ? '1px solid #27272a'
                          : '1px solid #1c1c20',
                        backgroundColor: isSelected
                          ? '#d6af71'
                          : slot.available
                          ? '#18181c'
                          : '#111113',
                        color: isSelected
                          ? '#0f0f11'
                          : slot.available
                          ? '#ffffff'
                          : '#4b4b53',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: slot.available ? 'pointer' : 'not-allowed',
                        textDecoration: slot.available ? 'none' : 'line-through',
                      }}
                    >
                      {slot.timeString}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              disabled={!selectedTimeSlot}
              onClick={() => goToStep(4)}
              style={{
                marginTop: '1.25rem',
                width: '100%',
                padding: '0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: selectedTimeSlot ? '#d6af71' : '#27272a',
                color: selectedTimeSlot ? '#0f0f11' : '#71717a',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: selectedTimeSlot ? 'pointer' : 'not-allowed',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              Next: Enter Contact Info →
            </button>
          </div>
        )}

        {/* STEP 4: CONTACT & CONFIRMATION */}
        {step === 4 && (
          <form onSubmit={handleConfirmBooking}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 600 }}>4. Your Details</h2>
              <button
                type="button"
                onClick={() => goToStep(3)}
                style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                ← Back
              </button>
            </div>

            {/* Summary Ticket */}
            <div
              style={{
                padding: '1rem',
                backgroundColor: '#151518',
                borderRadius: '8px',
                border: '1px solid #27272a',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: '#d6af71' }}>{currentService.name}</span>
                <span style={{ fontWeight: 700 }}>£{finalPrice.toFixed(0)}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#a1a1aa', display: 'grid', gap: '0.25rem' }}>
                <span>📍 {currentBranch.name} ({currentBranch.addressLine1})</span>
                <span>👤 Barber: {DEMO_STAFF.find((s) => s.id === selectedStaffId)?.fullName || 'Any Barber'}</span>
                <span>📅 {selectedDate} at {selectedTimeSlot ? new Date(selectedTimeSlot).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
              </div>
            </div>

            {/* Student & NHS Discounts */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#a1a1aa', marginBottom: '0.5rem' }}>
                Special Discounts:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setDiscountType(discountType === 'STUDENT_10' ? 'NONE' : 'STUDENT_10')}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: discountType === 'STUDENT_10' ? '1.5px solid #d6af71' : '1px solid #27272a',
                    backgroundColor: discountType === 'STUDENT_10' ? 'rgba(214, 175, 113, 0.15)' : '#18181c',
                    color: discountType === 'STUDENT_10' ? '#d6af71' : '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  🎓 Student 10% Off
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType(discountType === 'NHS_10' ? 'NONE' : 'NHS_10')}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: discountType === 'NHS_10' ? '1.5px solid #d6af71' : '1px solid #27272a',
                    backgroundColor: discountType === 'NHS_10' ? 'rgba(214, 175, 113, 0.15)' : '#18181c',
                    color: discountType === 'NHS_10' ? '#d6af71' : '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  🏥 NHS Card 10% Off
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #27272a',
                    backgroundColor: '#151518',
                    color: '#ffffff',
                    boxSizing: 'border-box',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '4px' }}>
                  Mobile Phone * (For free SMS booking reminder)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 07123 456789"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #27272a',
                    backgroundColor: '#151518',
                    color: '#ffffff',
                    boxSizing: 'border-box',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '4px' }}>
                  Email Address (Optional, for calendar invite)
                </label>
                <input
                  type="email"
                  placeholder="e.g. client@example.co.uk"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #27272a',
                    backgroundColor: '#151518',
                    color: '#ffffff',
                    boxSizing: 'border-box',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '4px' }}>
                  Special Barber Requests (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0.5 skin fade, extra hot towel"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #27272a',
                    backgroundColor: '#151518',
                    color: '#ffffff',
                    boxSizing: 'border-box',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.95rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#d6af71',
                color: '#0f0f11',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: isSubmitting ? 'wait' : 'pointer',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                boxShadow: '0 4px 14px rgba(214, 175, 113, 0.3)',
              }}
            >
              {isSubmitting ? 'Securing Booking...' : `Confirm Booking • £${finalPrice.toFixed(0)} (Pay in Shop)`}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#71717a', margin: '0.75rem 0 0 0' }}>
              🔒 Guaranteed zero booking fees. No upfront card charges.
            </p>
          </form>
        )}

        {/* STEP 5: BOOKING CONFIRMED */}
        {confirmation && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 1.25rem auto',
                borderRadius: '50%',
                backgroundColor: 'rgba(214, 175, 113, 0.2)',
                border: '2px solid #d6af71',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                color: '#d6af71',
              }}
            >
              ✓
            </div>

            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', color: '#ffffff', fontWeight: 700 }}>
              Appointment Confirmed!
            </h2>
            <p style={{ margin: '0 0 1.25rem 0', color: '#a1a1aa', fontSize: '0.9rem' }}>
              We have reserved your slot at <strong>{confirmation.branchName}</strong>.
            </p>

            <div
              style={{
                backgroundColor: '#151518',
                border: '1px solid #27272a',
                borderRadius: '10px',
                padding: '1.25rem',
                textAlign: 'left',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222227', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#71717a' }}>Booking Reference</span>
                <strong style={{ fontSize: '0.95rem', color: '#d6af71', letterSpacing: '1px' }}>
                  {confirmation.referenceCode}
                </strong>
              </div>

              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: '#71717a' }}>Service: </span>
                  <strong>{confirmation.serviceName}</strong>
                </div>
                <div>
                  <span style={{ color: '#71717a' }}>Barber: </span>
                  <strong>{confirmation.staffName}</strong>
                </div>
                <div>
                  <span style={{ color: '#71717a' }}>Date & Time: </span>
                  <strong>
                    {new Date(confirmation.startsAt).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}{' '}
                    at {new Date(confirmation.startsAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#71717a' }}>Location: </span>
                  <span>{confirmation.branchAddress}</span>
                </div>
                <div>
                  <span style={{ color: '#71717a' }}>Price: </span>
                  <strong style={{ color: '#d6af71' }}>£{(confirmation.finalPriceInPence / 100).toFixed(0)} (Pay in Shop)</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setConfirmation(null);
                  goToStep(1);
                  setSelectedTimeSlot('');
                }}
                style={{
                  padding: '0.75rem 1.4rem',
                  borderRadius: '6px',
                  border: '1px solid #3f3f46',
                  backgroundColor: '#18181c',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Book Another Appointment
              </button>

              <button
                type="button"
                onClick={() => {
                  window.parent?.postMessage({ type: 'BESPOKE_CLOSE_MODAL' }, '*');
                }}
                style={{
                  padding: '0.75rem 1.6rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#d6af71',
                  color: '#0f0f11',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Done / Close Window ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Powered by Bespoke Bookings footer */}
      <div
        style={{
          padding: '0.75rem',
          backgroundColor: '#0a0a0c',
          borderTop: '1px solid #1c1c20',
          textAlign: 'center',
          fontSize: '0.7rem',
          color: '#52525b',
        }}
      >
        Direct Barber Booking Engine • Zero Platform Fees • Powered by{' '}
        <span style={{ color: '#d6af71', fontWeight: 600 }}>Bespoke Bookings</span>
      </div>
    </div>
  );
}
