'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AppointmentStatus, ServiceDTO, BranchDTO, StaffDTO } from '@bespoke/types';
import type { EnrichedStoredAppointment } from '@bespoke/database';

interface MetricsData {
  todayAppointmentsCount: number;
  todayRevenuePence: number;
  totalAppointmentsCount: number;
  totalRevenuePence: number;
  zeroCommissionSavedPence: number;
  activeBarbersCount: number;
}

interface PostalStatus {
  provider: string;
  serverHost: string;
  fromEmail: string;
  replyTo: string;
  dkimStatus: string;
  spfStatus: string;
  mxStatus: string;
  outgoingStatus: string;
  monthlyFee: string;
}

export default function BarberAdminPage() {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'staff' | 'hours' | 'postal'>('appointments');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Data states
  const [appointments, setAppointments] = useState<EnrichedStoredAppointment[]>([]);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [services, setServices] = useState<ServiceDTO[]>([]);
  const [branches, setBranches] = useState<BranchDTO[]>([]);
  const [staffList, setStaffList] = useState<StaffDTO[]>([]);
  const [postalStatus, setPostalStatus] = useState<PostalStatus | null>(null);

  // UI state
  // Appointment View mode & selection state
  const [appointmentViewMode, setAppointmentViewMode] = useState<'timeline' | 'list'>('timeline');
  const [selectedAppointmentForModal, setSelectedAppointmentForModal] = useState<EnrichedStoredAppointment | null>(null);
  const [reassignTargetStaffId, setReassignTargetStaffId] = useState<string>('');
  const [reassignError, setReassignError] = useState<string | null>(null);
  const [reassignLoading, setReassignLoading] = useState<boolean>(false);
  const [walkInIsAnyBarber, setWalkInIsAnyBarber] = useState<boolean>(false);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState<boolean>(false);
  const [walkInSubmitting, setWalkInSubmitting] = useState<boolean>(false);
  const [walkInError, setWalkInError] = useState<string | null>(null);

  // New Walk-in form state
  const [walkInBranch, setWalkInBranch] = useState<string>('soho');
  const [walkInServiceId, setWalkInServiceId] = useState<string>('');
  const [walkInStaffId, setWalkInStaffId] = useState<string>('');
  const [walkInTime, setWalkInTime] = useState<string>('12:00');
  const [walkInDate, setWalkInDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [walkInCustomerName, setWalkInCustomerName] = useState<string>('');
  const [walkInCustomerPhone, setWalkInCustomerPhone] = useState<string>('');
  const [walkInCustomerEmail, setWalkInCustomerEmail] = useState<string>('');
  const [walkInNotes, setWalkInNotes] = useState<string>('Walk-in booking created at front desk');

  // Service Edit State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editPricePence, setEditPricePence] = useState<number>(0);
  const [editDuration, setEditDuration] = useState<number>(30);
  const [isSavingService, setIsSavingService] = useState<boolean>(false);

  // Flash action notification
  const triggerToast = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  // Branch & Barber computation for timeline
  const currentBranch = useMemo(() => {
    return branches.find((b) => b.slug === selectedBranch);
  }, [branches, selectedBranch]);

  const activeBranchBarbers = useMemo(() => {
    return staffList.filter((s) => {
      if (s.id === 'staff-any') return false;
      if (selectedBranch === 'all' || !currentBranch) return true;
      return s.branchIds.includes(currentBranch.id);
    });
  }, [staffList, selectedBranch, currentBranch]);

  const timelineBarbers = useMemo(() => {
    if (selectedStaffFilter !== 'all') {
      return activeBranchBarbers.filter((b) => b.id === selectedStaffFilter);
    }
    return activeBranchBarbers;
  }, [activeBranchBarbers, selectedStaffFilter]);

  const appointmentsByBarber = useMemo(() => {
    const map: Record<string, EnrichedStoredAppointment[]> = {};
    for (const b of staffList) {
      map[b.id] = [];
    }
    for (const appt of appointments) {
      if (!map[appt.staffId]) map[appt.staffId] = [];
      map[appt.staffId].push(appt);
    }
    return map;
  }, [staffList, appointments]);

  const padZero = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  const getAppointmentPosition = (startsAtISO: string, endsAtISO: string) => {
    const start = new Date(startsAtISO);
    const end = new Date(endsAtISO);

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();

    const timelineStartMinutes = 9 * 60; // 09:00
    const timelineEndMinutes = 19 * 60;   // 19:00

    if (endMinutes <= timelineStartMinutes || startMinutes >= timelineEndMinutes) {
      return null;
    }

    const clampedStart = Math.max(startMinutes, timelineStartMinutes);
    const clampedEnd = Math.min(endMinutes, timelineEndMinutes);
    const duration = Math.max(clampedEnd - clampedStart, 25); // minimum height for UI readability

    const topPx = (clampedStart - timelineStartMinutes) * (80 / 60);
    const heightPx = duration * (80 / 60);

    return { topPx, heightPx };
  };

  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const isSelectedDateToday = selectedDateFilter === todayDateStr;
  const [nowMinutes, setNowMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setNowMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const isNowInOperatingHours = isSelectedDateToday && nowMinutes >= 9 * 60 && nowMinutes <= 19 * 60;
  const currentTimeTopPx = (nowMinutes - 9 * 60) * (80 / 60);

  // Open detail/reassignment modal
  const openAppointmentDetails = (appt: EnrichedStoredAppointment) => {
    setSelectedAppointmentForModal(appt);
    setReassignTargetStaffId(appt.staffId);
    setReassignError(null);
  };

  // Reassign barber handler
  const handleReassignBarber = async () => {
    if (!selectedAppointmentForModal || !reassignTargetStaffId) return;
    if (reassignTargetStaffId === selectedAppointmentForModal.staffId) {
      setReassignError('Please select a different barber to move this appointment to.');
      return;
    }

    setReassignLoading(true);
    setReassignError(null);

    try {
      const res = await fetch('/api/v1/admin/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAppointmentForModal.id,
          staffId: reassignTargetStaffId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reassign barber');
      }

      const targetBarber = staffList.find((s) => s.id === reassignTargetStaffId);
      triggerToast(`Appointment reassigned to ${targetBarber?.fullName || 'new barber'}`);
      setSelectedAppointmentForModal(null);
      loadAppointments();
    } catch (err: unknown) {
      setReassignError(err instanceof Error ? err.message : 'Error reassigning barber');
    } finally {
      setReassignLoading(false);
    }
  };

  // Timeline slot click handler
  const handleTimelineSlotClick = (staffId: string, timeStr: string) => {
    setWalkInStaffId(staffId);
    setWalkInTime(timeStr);
    setWalkInDate(selectedDateFilter);
    if (selectedBranch !== 'all') {
      setWalkInBranch(selectedBranch);
    }
    setWalkInIsAnyBarber(false);
    setWalkInError(null);
    setIsWalkInModalOpen(true);
  };

  // Fetch appointments and metrics
  const loadAppointments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedBranch !== 'all') params.set('branch', selectedBranch);
      if (selectedDateFilter) params.set('date', selectedDateFilter);
      if (selectedStaffFilter !== 'all') params.set('staff', selectedStaffFilter);
      if (selectedStatusFilter !== 'all') params.set('status', selectedStatusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/v1/admin/appointments?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments);
        setMetrics(data.metrics);
      }
    } catch (e) {
      console.error('Failed to load appointments:', e);
    }
  }, [selectedBranch, selectedDateFilter, selectedStaffFilter, selectedStatusFilter, searchQuery]);

  // Initial load for services, settings, staff
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const [servicesRes, settingsRes] = await Promise.all([
          fetch('/api/v1/admin/services'),
          fetch('/api/v1/admin/settings'),
        ]);

        const servicesData = await servicesRes.json();
        const settingsData = await settingsRes.json();

        if (servicesData.success) {
          setServices(servicesData.services);
          if (servicesData.services.length > 0) {
            setWalkInServiceId(servicesData.services[0].id);
          }
        }

        if (settingsData.success) {
          setBranches(settingsData.branches);
          setStaffList(settingsData.staff);
          setPostalStatus(settingsData.postalEmailStatus);
          const firstBarber = settingsData.staff.find((s: StaffDTO) => s.id !== 'staff-any');
          if (firstBarber) {
            setWalkInStaffId(firstBarber.id);
          }
        }
      } catch (err) {
        console.error('Error fetching admin settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Reload appointments when filters change
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Update appointment status handler
  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const res = await fetch('/api/v1/admin/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Appointment status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
        if (selectedAppointmentForModal && selectedAppointmentForModal.id === id) {
          setSelectedAppointmentForModal((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        loadAppointments();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Create Walk-in handler
  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkInError(null);
    setWalkInSubmitting(true);

    try {
      const startsAt = new Date(`${walkInDate}T${walkInTime}:00`).toISOString();
      const res = await fetch('/api/v1/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchSlug: walkInBranch,
          serviceId: walkInServiceId,
          staffId: walkInStaffId,
          isAnyBarber: walkInIsAnyBarber,
          startsAt,
          customerName: walkInCustomerName,
          customerPhone: walkInCustomerPhone,
          customerEmail: walkInCustomerEmail || undefined,
          notes: walkInNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to book walk-in');
      }

      setIsWalkInModalOpen(false);
      setWalkInCustomerName('');
      setWalkInCustomerPhone('');
      setWalkInCustomerEmail('');
      setWalkInIsAnyBarber(false);
      triggerToast(`Walk-in booked successfully! Ref: ${data.appointment.referenceCode}`);
      loadAppointments();
    } catch (err: unknown) {
      setWalkInError(err instanceof Error ? err.message : 'Error booking appointment');
    } finally {
      setWalkInSubmitting(false);
    }
  };

  // Save Service pricing
  const handleSaveService = async (serviceId: string) => {
    setIsSavingService(true);
    try {
      const res = await fetch('/api/v1/admin/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: serviceId,
          priceInPence: editPricePence,
          durationMinutes: editDuration,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setServices((prev) =>
          prev.map((s) => (s.id === serviceId ? { ...s, priceInPence: editPricePence, durationMinutes: editDuration } : s))
        );
        setEditingServiceId(null);
        triggerToast('Service pricing and duration updated.');
      }
    } catch (err) {
      console.error('Failed to update service:', err);
    } finally {
      setIsSavingService(false);
    }
  };

  // Toggle service active state
  const handleToggleServiceActive = async (service: ServiceDTO) => {
    try {
      const res = await fetch('/api/v1/admin/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: service.id,
          isActive: !service.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, isActive: !service.isActive } : s))
        );
        triggerToast(`Service "${service.name}" ${!service.isActive ? 'enabled' : 'hidden'}`);
      }
    } catch (err) {
      console.error('Failed to toggle service:', err);
    }
  };

  const formatPence = (pence: number) => `£${(pence / 100).toFixed(2)}`;

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ backgroundColor: '#0c0c0e', minHeight: '100vh', color: '#f4f4f5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* SUCCESS TOAST BANNER */}
      {actionSuccessMessage && (
        <div style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.25rem',
          backgroundColor: '#064e3b',
          color: '#6ee7b7',
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
          border: '1px solid #059669',
          zIndex: 9999,
          fontWeight: 600,
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span>✓</span>
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* TOP NAVIGATION / IDENTITY BAR */}
      <header style={{
        backgroundColor: '#121215',
        borderBottom: '1px solid #1f1f24',
        padding: '0.85rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#d6af71',
              color: '#000',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
            }}>
              ✂
            </span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fff' }}>
                Crown &amp; Blade Barbers
              </div>
              <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                Bespoke Booking Platform • Barber Operations Portal
              </div>
            </div>
          </div>

          <span style={{
            fontSize: '0.7rem',
            backgroundColor: '#1c1c21',
            color: '#d6af71',
            padding: '0.2rem 0.6rem',
            borderRadius: '999px',
            border: '1px solid rgba(214, 175, 113, 0.3)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            GCIP Auth Verified
          </span>
        </div>

        {/* TOP ACTIONS & SESSION PROFILE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setIsWalkInModalOpen(true)}
            style={{
              backgroundColor: '#d6af71',
              color: '#0f0f11',
              border: 'none',
              padding: '0.6rem 1.15rem',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.825rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'background 0.2s',
            }}
          >
            <span>+</span>
            <span>New Walk-in / Phone Booking</span>
          </button>

          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noreferrer"
            style={{
              backgroundColor: '#1f1f26',
              color: '#d4d4d8',
              border: '1px solid #2e2e38',
              padding: '0.6rem 1rem',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.825rem',
              textDecoration: 'none',
            }}
          >
            View Customer Site ↗
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingLeft: '0.5rem', borderLeft: '1px solid #24242c' }}>
            <img
              src="/avatars/arthur.svg"
              alt="Arthur Pendelton"
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #d6af71' }}
            />
            <div style={{ fontSize: '0.8rem', lineHeight: 1.2 }}>
              <div style={{ fontWeight: 700, color: '#f4f4f5' }}>Arthur Pendelton</div>
              <div style={{ color: '#d6af71', fontSize: '0.7rem' }}>Master Barber (Owner)</div>
            </div>
          </div>
        </div>
      </header>

      {/* METRICS & ZERO-COMMISSION TICKER */}
      <div style={{ padding: '1.5rem 2rem 0.5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          {/* Card 1: Today's Bookings */}
          <div style={{
            backgroundColor: '#141418',
            border: '1px solid #1f1f26',
            borderRadius: '8px',
            padding: '1.25rem',
            position: 'relative',
          }}>
            <div style={{ fontSize: '0.75rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Today&apos;s Appointments
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
              {metrics ? metrics.todayAppointmentsCount : '—'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.35rem', fontWeight: 600 }}>
              ● Live Rota Active
            </div>
          </div>

          {/* Card 2: Today's Revenue */}
          <div style={{
            backgroundColor: '#141418',
            border: '1px solid #1f1f26',
            borderRadius: '8px',
            padding: '1.25rem',
          }}>
            <div style={{ fontSize: '0.75rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Projected Gross Revenue
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#d6af71', marginTop: '0.25rem' }}>
              {metrics ? formatPence(metrics.todayRevenuePence) : '—'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.35rem' }}>
              All chairs combined
            </div>
          </div>

          {/* Card 3: Zero Commission Savings */}
          <div style={{
            backgroundColor: 'rgba(214, 175, 113, 0.08)',
            border: '1px solid rgba(214, 175, 113, 0.3)',
            borderRadius: '8px',
            padding: '1.25rem',
          }}>
            <div style={{ fontSize: '0.75rem', color: '#d6af71', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Zero-Commission Savings
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f3d399', marginTop: '0.25rem' }}>
              +{metrics ? formatPence(metrics.zeroCommissionSavedPence) : '—'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#c49957', marginTop: '0.35rem', fontWeight: 600 }}>
              Saved vs 20% Fresha marketplace fee!
            </div>
          </div>

          {/* Card 4: Postal Email Deliverability */}
          <div style={{
            backgroundColor: '#141418',
            border: '1px solid #1f1f26',
            borderRadius: '8px',
            padding: '1.25rem',
          }}>
            <div style={{ fontSize: '0.75rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Postal Email Engine
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>✓</span>
              <span>100% Operational</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.35rem' }}>
              SPF & DKIM Verified (crownandblade.example)
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid #22222a',
          paddingBottom: '0.5rem',
          flexWrap: 'wrap',
        }}>
          {([
            { id: 'appointments', label: "Today's Chair Rota & Bookings", icon: '📅' },
            { id: 'services', label: 'Service Menu & Prices', icon: '✂️' },
            { id: 'staff', label: 'Barber Rota & Stylists', icon: '💈' },
            { id: 'hours', label: 'Branch Opening Hours', icon: '⏰' },
            { id: 'postal', label: 'Postal Email & DNS Health', icon: '✉️' },
          ] as const).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  backgroundColor: isActive ? '#24242c' : 'transparent',
                  color: isActive ? '#d6af71' : '#9ca3af',
                  border: isActive ? '1px solid #383844' : '1px solid transparent',
                  padding: '0.6rem 1.1rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT PANELS */}
      <main style={{ padding: '1rem 2rem 3rem' }}>
        
        {/* ==================== TAB 1: APPOINTMENTS ROTA ==================== */}
        {activeTab === 'appointments' && (
          <div>
            {/* Filter Bar */}
            <div style={{
              backgroundColor: '#141418',
              border: '1px solid #1f1f26',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                {/* Branch selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    Branch
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    style={{
                      backgroundColor: '#1b1b22',
                      color: '#f4f4f5',
                      border: '1px solid #2d2d38',
                      padding: '0.45rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.825rem',
                    }}
                  >
                    <option value="all">All Branches</option>
                    <option value="soho">Soho (Brewer Ln)</option>
                    <option value="shoreditch">Shoreditch (Redchurch Mews)</option>
                  </select>
                </div>

                {/* Date picker */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDateFilter}
                    onChange={(e) => setSelectedDateFilter(e.target.value)}
                    style={{
                      backgroundColor: '#1b1b22',
                      color: '#f4f4f5',
                      border: '1px solid #2d2d38',
                      padding: '0.45rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.825rem',
                    }}
                  />
                </div>

                {/* Quick Date Shortcuts */}
                <div style={{ display: 'flex', gap: '0.35rem', alignSelf: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedDateFilter(new Date().toISOString().split('T')[0])}
                    style={{
                      backgroundColor: selectedDateFilter === new Date().toISOString().split('T')[0] ? '#d6af71' : '#22222a',
                      color: selectedDateFilter === new Date().toISOString().split('T')[0] ? '#000' : '#d4d4d8',
                      border: 'none',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.775rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tmrw = new Date();
                      tmrw.setDate(tmrw.getDate() + 1);
                      setSelectedDateFilter(tmrw.toISOString().split('T')[0]);
                    }}
                    style={{
                      backgroundColor: '#22222a',
                      color: '#d4d4d8',
                      border: 'none',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.775rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Tomorrow
                  </button>
                </div>

                {/* Barber filter */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    Barber
                  </label>
                  <select
                    value={selectedStaffFilter}
                    onChange={(e) => setSelectedStaffFilter(e.target.value)}
                    style={{
                      backgroundColor: '#1b1b22',
                      color: '#f4f4f5',
                      border: '1px solid #2d2d38',
                      padding: '0.45rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.825rem',
                    }}
                  >
                    <option value="all">All Barbers</option>
                    {staffList.filter((s) => s.id !== 'staff-any').map((s) => (
                      <option key={s.id} value={s.id}>{s.fullName}</option>
                    ))}
                  </select>
                </div>

                {/* Status filter */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    Status
                  </label>
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    style={{
                      backgroundColor: '#1b1b22',
                      color: '#f4f4f5',
                      border: '1px solid #2d2d38',
                      padding: '0.45rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.825rem',
                    }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No-Show</option>
                  </select>
                </div>
              </div>

              {/* Search input */}
              <div style={{ minWidth: '220px' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Search Customer / Ref
                </label>
                <input
                  type="text"
                  placeholder="e.g. Marcus, 07700, CBB-..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1b1b22',
                    color: '#f4f4f5',
                    border: '1px solid #2d2d38',
                    padding: '0.45rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.825rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Header with Switcher: Day Timeline vs List Rota */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Bookings Rota ({appointments.length} Total)
                </h2>
                <span style={{
                  fontSize: '0.75rem',
                  backgroundColor: '#1b1b22',
                  border: '1px solid #2d2d38',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  color: '#a1a1aa',
                }}>
                  Date: <strong style={{ color: '#d6af71' }}>{selectedDateFilter || 'All Dates'}</strong>
                </span>
                {isSelectedDateToday && (
                  <span style={{
                    fontSize: '0.7rem',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                    TODAY
                  </span>
                )}
              </div>

              {/* View Mode Toggle */}
              <div style={{
                display: 'inline-flex',
                backgroundColor: '#141418',
                border: '1px solid #272732',
                borderRadius: '8px',
                padding: '0.25rem',
                gap: '0.25rem',
              }}>
                <button
                  type="button"
                  onClick={() => setAppointmentViewMode('timeline')}
                  style={{
                    backgroundColor: appointmentViewMode === 'timeline' ? '#d6af71' : 'transparent',
                    color: appointmentViewMode === 'timeline' ? '#0f0f12' : '#a1a1aa',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.4rem 0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>⏱️</span>
                  <span>Day Timeline</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAppointmentViewMode('list')}
                  style={{
                    backgroundColor: appointmentViewMode === 'list' ? '#d6af71' : 'transparent',
                    color: appointmentViewMode === 'list' ? '#0f0f12' : '#a1a1aa',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.4rem 0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>📋</span>
                  <span>List Rota</span>
                </button>
              </div>
            </div>

            {/* ========================================================= */}
            {/* VIEW 1: INTERACTIVE DAY TIMELINE (09:00 - 19:00)           */}
            {/* ========================================================= */}
            {appointmentViewMode === 'timeline' && (
              <div style={{ backgroundColor: '#141418', border: '1px solid #1f1f26', borderRadius: '8px', overflow: 'hidden' }}>
                {/* Timeline Legend & Action Tips */}
                <div style={{
                  padding: '0.85rem 1.25rem',
                  borderBottom: '1px solid #1f1f26',
                  backgroundColor: '#101014',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  fontSize: '0.75rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Booking Legend:
                    </span>

                    {/* Specific Barber Pill */}
                    <div
                      title="Customer directly chose this specific barber. High client loyalty."
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        backgroundColor: 'rgba(214, 175, 113, 0.12)',
                        border: '1px solid rgba(214, 175, 113, 0.4)',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '4px',
                        color: '#d6af71',
                        fontWeight: 700,
                      }}
                    >
                      <span>★</span>
                      <span>Specific Barber Requested (Client Loyalty)</span>
                    </div>

                    {/* Any Barber (Pool) Pill */}
                    <div
                      title="Customer selected 'Any Barber' when booking. Safe to rebalance across free chairs."
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        backgroundColor: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '4px',
                        color: '#38bdf8',
                        fontWeight: 700,
                      }}
                    >
                      <span>🎲</span>
                      <span>Any Barber (Flexible Pool / Auto-allocated)</span>
                    </div>

                    {/* Empty Slot hint */}
                    <div style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ color: '#d6af71', fontWeight: 700 }}>+</span>
                      <span>Click empty slot to book walk-in</span>
                    </div>
                  </div>

                  <div style={{ color: '#71717a', fontSize: '0.75rem' }}>
                    Salon Hours: <strong style={{ color: '#f4f4f5' }}>09:00 – 19:00</strong>
                  </div>
                </div>

                {/* Timeline Grid Container */}
                {timelineBarbers.length === 0 ? (
                  <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#71717a' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💈</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#a1a1aa' }}>
                      No active barbers found for this filter
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      Try selecting &ldquo;All Branches&rdquo; or resetting the barber filter above.
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', position: 'relative' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: `70px repeat(${timelineBarbers.length}, minmax(220px, 1fr))`,
                      minWidth: `${70 + timelineBarbers.length * 220}px`,
                      position: 'relative',
                    }}>
                      {/* TOP HEADER ROW: Corner + Barber Columns */}
                      <div style={{
                        padding: '0.75rem 0.5rem',
                        backgroundColor: '#0e0e12',
                        borderBottom: '2px solid #22222a',
                        borderRight: '1px solid #1f1f26',
                        textAlign: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#71717a',
                        textTransform: 'uppercase',
                      }}>
                        Time
                      </div>

                      {timelineBarbers.map((barber) => {
                        const barberAppts = appointmentsByBarber[barber.id] || [];
                        const requestedCount = barberAppts.filter((a) => !a.isAnyBarber).length;
                        const poolCount = barberAppts.filter((a) => a.isAnyBarber).length;

                        return (
                          <div
                            key={barber.id}
                            style={{
                              padding: '0.75rem 1rem',
                              backgroundColor: '#0e0e12',
                              borderBottom: '2px solid #22222a',
                              borderRight: '1px solid #1f1f26',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span>💈</span>
                                <span>{barber.fullName}</span>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#a1a1aa', marginTop: '0.1rem' }}>
                                {barber.role === 'owner' ? 'Owner / Master Barber' : barber.role === 'manager' ? 'Branch Manager' : 'Master Barber'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f4f4f5' }}>
                                {barberAppts.length} {barberAppts.length === 1 ? 'Cut' : 'Cuts'}
                              </span>
                              <div style={{ display: 'flex', gap: '0.3rem', fontSize: '0.625rem' }}>
                                {requestedCount > 0 && (
                                  <span style={{ color: '#d6af71', fontWeight: 700 }} title="Specific requests">
                                    ★ {requestedCount}
                                  </span>
                                )}
                                {poolCount > 0 && (
                                  <span style={{ color: '#38bdf8', fontWeight: 700 }} title="Pool queue">
                                    🎲 {poolCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* TIMELINE BODY ROW: Left Time Axis */}
                      <div style={{
                        position: 'relative',
                        height: '800px',
                        backgroundColor: '#0e0e12',
                        borderRight: '1px solid #1f1f26',
                      }}>
                        {Array.from({ length: 11 }).map((_, i) => {
                          const hour = 9 + i;
                          const topPx = i * 80;
                          return (
                            <div
                              key={hour}
                              style={{
                                position: 'absolute',
                                top: `${topPx}px`,
                                left: 0,
                                right: 0,
                                transform: 'translateY(-50%)',
                                textAlign: 'center',
                                fontSize: '0.72rem',
                                color: '#a1a1aa',
                                fontWeight: 700,
                                fontFamily: 'monospace',
                              }}
                            >
                              {padZero(hour)}:00
                            </div>
                          );
                        })}
                      </div>

                      {/* Barber Columns with 30-min Grid Slots and Appointments */}
                      {timelineBarbers.map((barber) => {
                        const barberAppts = appointmentsByBarber[barber.id] || [];

                        return (
                          <div
                            key={barber.id}
                            style={{
                              position: 'relative',
                              height: '800px',
                              borderRight: '1px solid #1f1f26',
                              backgroundColor: '#121217',
                            }}
                          >
                            {/* 30-minute Background Grid Slots (Click to book) */}
                            {Array.from({ length: 20 }).map((_, slotIdx) => {
                              const slotHour = Math.floor(slotIdx / 2) + 9;
                              const slotMin = (slotIdx % 2) * 30;
                              const timeStr = `${padZero(slotHour)}:${padZero(slotMin)}`;
                              const isHourBoundary = slotIdx % 2 === 0;

                              return (
                                <div
                                  key={slotIdx}
                                  onClick={() => handleTimelineSlotClick(barber.id, timeStr)}
                                  title={`+ Click to book walk-in at ${timeStr} for ${barber.fullName}`}
                                  style={{
                                    height: '40px',
                                    borderBottom: isHourBoundary ? '1px dashed #202029' : '1px solid #23232e',
                                    boxSizing: 'border-box',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    paddingRight: '0.5rem',
                                    transition: 'background-color 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(214, 175, 113, 0.08)';
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <span style={{
                                    fontSize: '0.62rem',
                                    color: '#3f3f4a',
                                    fontFamily: 'monospace',
                                    opacity: 0.6,
                                    pointerEvents: 'none',
                                    userSelect: 'none',
                                  }}>
                                    {timeStr}
                                  </span>
                                </div>
                              );
                            })}

                            {/* Render Appointments as Positioned Blocks */}
                            {barberAppts.map((appt) => {
                              const pos = getAppointmentPosition(appt.startsAt, appt.endsAt);
                              if (!pos) return null;

                              const isAny = Boolean(appt.isAnyBarber);
                              const isCompleted = appt.status === 'completed';
                              const isCancelled = appt.status === 'cancelled';
                              const isNoShow = appt.status === 'no_show';

                              // Theme selection based on Specific Barber vs Any Barber
                              const borderColor = isCompleted
                                ? '#059669'
                                : isCancelled
                                ? '#dc2626'
                                : isAny
                                ? '#38bdf8'
                                : '#d6af71';

                              const bgColor = isCompleted
                                ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.92) 0%, rgba(15, 23, 42, 0.95) 100%)'
                                : isCancelled
                                ? 'linear-gradient(135deg, rgba(69, 10, 10, 0.85) 0%, rgba(20, 20, 24, 0.95) 100%)'
                                : isAny
                                ? 'linear-gradient(135deg, rgba(14, 55, 80, 0.95) 0%, rgba(18, 22, 28, 0.95) 100%)'
                                : 'linear-gradient(135deg, rgba(58, 44, 18, 0.95) 0%, rgba(24, 21, 18, 0.95) 100%)';

                              return (
                                <div
                                  key={appt.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openAppointmentDetails(appt);
                                  }}
                                  title={`Click to view details or reassign chair: ${appt.customerName} (${appt.serviceName})`}
                                  style={{
                                    position: 'absolute',
                                    top: `${pos.topPx + 2}px`,
                                    height: `${pos.heightPx - 4}px`,
                                    left: '4px',
                                    right: '4px',
                                    backgroundColor: '#16161b',
                                    background: bgColor,
                                    border: `1.5px solid ${borderColor}`,
                                    borderRadius: '6px',
                                    padding: '0.45rem 0.6rem',
                                    boxSizing: 'border-box',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    zIndex: 10,
                                    boxShadow: isAny
                                      ? '0 4px 12px rgba(56, 189, 248, 0.15)'
                                      : '0 4px 12px rgba(214, 175, 113, 0.15)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    opacity: isCancelled ? 0.6 : 1,
                                    transition: 'transform 0.12s ease, box-shadow 0.12s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
                                    (e.currentTarget as HTMLDivElement).style.zIndex = '20';
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                                    (e.currentTarget as HTMLDivElement).style.zIndex = '10';
                                  }}
                                >
                                  {/* Top line: Time + Distinct Preference Tag */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>
                                      {formatTime(appt.startsAt)} - {formatTime(appt.endsAt)}
                                    </span>

                                    {/* Preference Badge */}
                                    {isAny ? (
                                      <span style={{
                                        fontSize: '0.625rem',
                                        fontWeight: 800,
                                        backgroundColor: 'rgba(56, 189, 248, 0.25)',
                                        color: '#7dd3fc',
                                        border: '1px solid rgba(56, 189, 248, 0.45)',
                                        padding: '0.1rem 0.35rem',
                                        borderRadius: '3px',
                                        whiteSpace: 'nowrap',
                                        letterSpacing: '0.02em',
                                      }}>
                                        🎲 ANY BARBER
                                      </span>
                                    ) : (
                                      <span style={{
                                        fontSize: '0.625rem',
                                        fontWeight: 800,
                                        backgroundColor: 'rgba(214, 175, 113, 0.25)',
                                        color: '#fef08a',
                                        border: '1px solid rgba(214, 175, 113, 0.45)',
                                        padding: '0.1rem 0.35rem',
                                        borderRadius: '3px',
                                        whiteSpace: 'nowrap',
                                        letterSpacing: '0.02em',
                                      }}>
                                        ★ REQUESTED
                                      </span>
                                    )}
                                  </div>

                                  {/* Middle line: Customer Name */}
                                  <div style={{ marginTop: '0.2rem' }}>
                                    <div style={{
                                      fontWeight: 800,
                                      fontSize: '0.85rem',
                                      color: '#fff',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      textDecoration: isCancelled ? 'line-through' : 'none',
                                    }}>
                                      {appt.customerName}
                                    </div>
                                    <div style={{
                                      fontSize: '0.72rem',
                                      color: isAny ? '#bae6fd' : '#fde68a',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      marginTop: '0.1rem',
                                    }}>
                                      {appt.serviceName} • {formatPence(appt.finalPriceInPence)}
                                    </div>
                                  </div>

                                  {/* Bottom line: Reference & Status hint */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', fontSize: '0.65rem' }}>
                                    <span style={{
                                      fontFamily: 'monospace',
                                      color: '#a1a1aa',
                                      backgroundColor: 'rgba(0,0,0,0.3)',
                                      padding: '0.1rem 0.3rem',
                                      borderRadius: '3px',
                                    }}>
                                      {appt.referenceCode}
                                    </span>
                                    <span style={{
                                      color: isCompleted ? '#34d399' : isCancelled ? '#f87171' : isNoShow ? '#fbbf24' : '#d4d4d8',
                                      fontWeight: 600,
                                      textTransform: 'uppercase',
                                    }}>
                                      {isCompleted ? '✓ Done' : isCancelled ? 'Cancelled' : 'Manage ➔'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}

                      {/* Current Time Laser Indicator Line (If viewing Today and salon open) */}
                      {isNowInOperatingHours && (
                        <div style={{
                          position: 'absolute',
                          top: `${currentTimeTopPx}px`,
                          left: '70px',
                          right: 0,
                          height: '2px',
                          backgroundColor: '#ef4444',
                          boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
                          zIndex: 30,
                          pointerEvents: 'none',
                          display: 'flex',
                          alignItems: 'center',
                        }}>
                          <span style={{
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            fontSize: '0.625rem',
                            fontWeight: 800,
                            padding: '0.1rem 0.35rem',
                            borderRadius: '3px',
                            marginLeft: '4px',
                            textTransform: 'uppercase',
                          }}>
                            NOW ({padZero(Math.floor(nowMinutes / 60))}:{padZero(nowMinutes % 60)})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW 2: LIST ROTA (TABULAR DETAILS)                       */}
            {/* ========================================================= */}
            {appointmentViewMode === 'list' && (
              <div style={{ backgroundColor: '#141418', border: '1px solid #1f1f26', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid #1f1f26', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>
                    Showing <strong>{appointments.length}</strong> appointments sorted by start time
                  </div>
                </div>

                {appointments.length === 0 ? (
                  <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: '#71717a' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💈</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#a1a1aa' }}>No appointments match your filters</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      Try changing the branch, date, or clear the search criteria.
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#101014', borderBottom: '1px solid #1f1f26', color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                          <th style={{ padding: '0.75rem 1rem' }}>Time</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Customer Details</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Service & Price</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Barber & Preference</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((appt) => {
                          const isConfirmed = appt.status === 'confirmed';
                          const isCompleted = appt.status === 'completed';
                          const isCancelled = appt.status === 'cancelled';
                          const isAny = Boolean(appt.isAnyBarber);

                          return (
                            <tr
                              key={appt.id}
                              style={{
                                borderBottom: '1px solid #1a1a20',
                                backgroundColor: isCompleted ? '#0f1412' : isCancelled ? '#161012' : '#141418',
                                transition: 'background 0.15s',
                              }}
                            >
                              {/* Time */}
                              <td style={{ padding: '1rem', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
                                  {formatTime(appt.startsAt)}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '0.15rem' }}>
                                  until {formatTime(appt.endsAt)} ({appt.durationMinutes}m)
                                </div>
                                <div style={{
                                  fontSize: '0.65rem',
                                  color: '#d6af71',
                                  marginTop: '0.35rem',
                                  fontFamily: 'monospace',
                                  backgroundColor: '#1c1c22',
                                  padding: '0.15rem 0.35rem',
                                  borderRadius: '4px',
                                  display: 'inline-block',
                                }}>
                                  {appt.referenceCode}
                                </div>
                              </td>

                              {/* Customer Details */}
                              <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                                <div style={{ fontWeight: 700, color: '#f4f4f5', fontSize: '0.9rem' }}>
                                  {appt.customerName}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                                  <a href={`tel:${appt.customerPhone}`} style={{ color: '#d6af71', textDecoration: 'none' }}>
                                    📞 {appt.customerPhone}
                                  </a>
                                </div>
                                {appt.customerEmail && (
                                  <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '0.1rem' }}>
                                    ✉️ {appt.customerEmail}
                                  </div>
                                )}
                                {appt.notes && (
                                  <div style={{ fontSize: '0.72rem', color: '#a1a1aa', marginTop: '0.3rem', fontStyle: 'italic', backgroundColor: '#1a1a22', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                    &ldquo;{appt.notes}&rdquo;
                                  </div>
                                )}
                              </td>

                              {/* Service & Price */}
                              <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                                <div style={{ fontWeight: 700, color: '#fff' }}>
                                  {appt.serviceName}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                                  <span style={{ fontWeight: 700, color: '#d6af71' }}>
                                    {formatPence(appt.finalPriceInPence)}
                                  </span>
                                  {appt.discountApplied && (
                                    <span style={{
                                      fontSize: '0.65rem',
                                      backgroundColor: '#064e3b',
                                      color: '#6ee7b7',
                                      padding: '0.1rem 0.4rem',
                                      borderRadius: '4px',
                                      fontWeight: 700,
                                    }}>
                                      10% DISCOUNT
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Barber & Preference Distinction */}
                              <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                                <div style={{ fontWeight: 600, color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span>💈</span>
                                  <span>{appt.staffName}</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.15rem' }}>
                                  {appt.branchName}
                                </div>
                                {/* Barber Request vs Any Barber Pill */}
                                <div style={{ marginTop: '0.35rem' }}>
                                  {isAny ? (
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                      color: '#38bdf8',
                                      border: '1px solid rgba(56, 189, 248, 0.35)',
                                      padding: '0.15rem 0.45rem',
                                      borderRadius: '4px',
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                    }}>
                                      <span>🎲</span>
                                      <span>ANY BARBER (POOL)</span>
                                    </span>
                                  ) : (
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      backgroundColor: 'rgba(214, 175, 113, 0.15)',
                                      color: '#d6af71',
                                      border: '1px solid rgba(214, 175, 113, 0.35)',
                                      padding: '0.15rem 0.45rem',
                                      borderRadius: '4px',
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                    }}>
                                      <span>★</span>
                                      <span>BARBER REQUESTED</span>
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Status Badge */}
                              <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '999px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  backgroundColor: isCompleted
                                    ? '#064e3b'
                                    : isConfirmed
                                    ? 'rgba(214, 175, 113, 0.15)'
                                    : isCancelled
                                    ? '#450a0a'
                                    : '#3f3f46',
                                  color: isCompleted
                                    ? '#6ee7b7'
                                    : isConfirmed
                                    ? '#d6af71'
                                    : isCancelled
                                    ? '#f87171'
                                    : '#d4d4d8',
                                  border: isConfirmed ? '1px solid rgba(214, 175, 113, 0.3)' : 'none',
                                }}>
                                  {appt.status.replace('_', ' ')}
                                </span>
                              </td>

                              {/* Action Buttons */}
                              <td style={{ padding: '1rem', verticalAlign: 'top', textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  {/* Reassign / Detail button */}
                                  <button
                                    type="button"
                                    onClick={() => openAppointmentDetails(appt)}
                                    style={{
                                      backgroundColor: '#1c1c24',
                                      color: '#d6af71',
                                      border: '1px solid #383846',
                                      padding: '0.35rem 0.65rem',
                                      borderRadius: '4px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    ⚙️ Move / Details
                                  </button>

                                  {isConfirmed && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleStatusChange(appt.id, 'completed')}
                                        style={{
                                          backgroundColor: '#064e3b',
                                          color: '#6ee7b7',
                                          border: '1px solid #059669',
                                          padding: '0.35rem 0.65rem',
                                          borderRadius: '4px',
                                          fontSize: '0.72rem',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                        }}
                                      >
                                        ✓ Complete Cut
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleStatusChange(appt.id, 'no_show')}
                                        style={{
                                          backgroundColor: '#27272a',
                                          color: '#a1a1aa',
                                          border: '1px solid #3f3f46',
                                          padding: '0.35rem 0.55rem',
                                          borderRadius: '4px',
                                          fontSize: '0.72rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                        }}
                                      >
                                        No-Show
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleStatusChange(appt.id, 'cancelled')}
                                        style={{
                                          backgroundColor: '#450a0a',
                                          color: '#fca5a5',
                                          border: '1px solid #7f1d1d',
                                          padding: '0.35rem 0.55rem',
                                          borderRadius: '4px',
                                          fontSize: '0.72rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                  {isCompleted && (
                                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, alignSelf: 'center' }}>
                                      ✓ Finished
                                    </span>
                                  )}
                                  {isCancelled && (
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(appt.id, 'confirmed')}
                                      style={{
                                        backgroundColor: '#27272a',
                                        color: '#d4d4d8',
                                        border: '1px solid #3f3f46',
                                        padding: '0.35rem 0.55rem',
                                        borderRadius: '4px',
                                        fontSize: '0.72rem',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Restore
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: SERVICES & PRICING ==================== */}
        {activeTab === 'services' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff', textTransform: 'uppercase' }}>
                  Grooming Service Menu & Pricing
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#a1a1aa', margin: '0.2rem 0 0' }}>
                  Update prices and durations. All changes sync immediately to both Soho & Shoreditch booking engines.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {services.map((svc) => {
                const isEditing = editingServiceId === svc.id;

                return (
                  <div
                    key={svc.id}
                    style={{
                      backgroundColor: '#141418',
                      border: '1px solid #1f1f26',
                      borderRadius: '8px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      opacity: svc.isActive ? 1 : 0.6,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: '#d6af71', textTransform: 'uppercase', fontWeight: 700 }}>
                            {svc.category}
                          </span>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.2rem 0 0', color: '#fff' }}>
                            {svc.name}
                          </h3>
                          {svc.subTitle && (
                            <div style={{ fontSize: '0.75rem', color: '#71717a' }}>{svc.subTitle}</div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleServiceActive(svc)}
                          style={{
                            backgroundColor: svc.isActive ? '#064e3b' : '#27272a',
                            color: svc.isActive ? '#6ee7b7' : '#9ca3af',
                            border: 'none',
                            padding: '0.25rem 0.55rem',
                            borderRadius: '999px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {svc.isActive ? 'Active' : 'Hidden'}
                        </button>
                      </div>

                      <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.75rem', lineHeight: 1.5 }}>
                        {svc.description}
                      </p>
                    </div>

                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #1f1f26' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: '0.7rem', color: '#a1a1aa' }}>Price (£)</label>
                              <input
                                type="number"
                                step="0.5"
                                value={editPricePence / 100}
                                onChange={(e) => setEditPricePence(Math.round(parseFloat(e.target.value || '0') * 100))}
                                style={{
                                  width: '100%',
                                  backgroundColor: '#1c1c22',
                                  color: '#fff',
                                  border: '1px solid #2d2d38',
                                  padding: '0.4rem 0.6rem',
                                  borderRadius: '4px',
                                  fontSize: '0.85rem',
                                }}
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: '0.7rem', color: '#a1a1aa' }}>Duration (mins)</label>
                              <input
                                type="number"
                                step="5"
                                value={editDuration}
                                onChange={(e) => setEditDuration(parseInt(e.target.value || '30', 10))}
                                style={{
                                  width: '100%',
                                  backgroundColor: '#1c1c22',
                                  color: '#fff',
                                  border: '1px solid #2d2d38',
                                  padding: '0.4rem 0.6rem',
                                  borderRadius: '4px',
                                  fontSize: '0.85rem',
                                }}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => setEditingServiceId(null)}
                              style={{
                                backgroundColor: '#27272a',
                                color: '#d4d4d8',
                                border: 'none',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveService(svc.id)}
                              disabled={isSavingService}
                              style={{
                                backgroundColor: '#d6af71',
                                color: '#000',
                                border: 'none',
                                padding: '0.35rem 0.85rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {isSavingService ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d6af71' }}>
                              {formatPence(svc.priceInPence)}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
                              ⏱️ {svc.durationMinutes} mins
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingServiceId(svc.id);
                              setEditPricePence(svc.priceInPence);
                              setEditDuration(svc.durationMinutes);
                            }}
                            style={{
                              backgroundColor: '#1e1e26',
                              color: '#d4d4d8',
                              border: '1px solid #2e2e3a',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Edit Price
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: STAFF & BARBERS ==================== */}
        {activeTab === 'staff' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff', textTransform: 'uppercase' }}>
                Master Barbers & Stylist Team
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#a1a1aa', margin: '0.2rem 0 0' }}>
                Manage barber profiles, active chair rosters, and branch assignments.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {staffList.filter((s) => s.id !== 'staff-any').map((barber) => (
                <div
                  key={barber.id}
                  style={{
                    backgroundColor: '#141418',
                    border: '1px solid #1f1f26',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    display: 'flex',
                    gap: '1.25rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <img
                    src={barber.avatarUrl || '/crown-and-blade-icon.svg'}
                    alt={barber.fullName}
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '2px solid #d6af71',
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                        {barber.fullName}
                      </h3>
                      <span style={{
                        fontSize: '0.65rem',
                        backgroundColor: '#1c1c24',
                        color: '#d6af71',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                      }}>
                        {barber.role}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.5rem', lineHeight: 1.4 }}>
                      {barber.bio}
                    </p>

                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', backgroundColor: '#064e3b', color: '#6ee7b7', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                        ● On Floor Today
                      </span>
                      <span style={{ fontSize: '0.7rem', backgroundColor: '#22222a', color: '#d4d4d8', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                        Soho &amp; Shoreditch
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 4: BRANCH HOURS ==================== */}
        {activeTab === 'hours' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff', textTransform: 'uppercase' }}>
                Weekly Operating Times
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#a1a1aa', margin: '0.2rem 0 0' }}>
                Configured operating hours govern the dynamic 7-day slot availability engine.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
              {branches.map((b) => (
                <div
                  key={b.id}
                  style={{
                    backgroundColor: '#141418',
                    border: '1px solid #1f1f26',
                    borderRadius: '8px',
                    padding: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #1f1f26', paddingBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                        {b.name}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                        📍 {b.addressLine1}, {b.postalCode} • 📞 {b.phone}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.7rem', backgroundColor: '#064e3b', color: '#6ee7b7', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                      Open
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {Object.entries(b.openingHours).map(([day, hours]) => (
                      <div
                        key={day}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: '#1a1a20',
                          borderRadius: '6px',
                          fontSize: '0.825rem',
                        }}
                      >
                        <span style={{ textTransform: 'capitalize', fontWeight: 600, color: '#e4e4e7' }}>
                          {day}
                        </span>
                        {hours.closed ? (
                          <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.75rem' }}>
                            Closed
                          </span>
                        ) : (
                          <span style={{ color: '#d6af71', fontWeight: 600 }}>
                            {hours.open} — {hours.close}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 5: POSTAL EMAIL & INFRASTRUCTURE ==================== */}
        {activeTab === 'postal' && postalStatus && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff', textTransform: 'uppercase' }}>
                Postal Email Deliverability & DNS Engine
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#a1a1aa', margin: '0.2rem 0 0' }}>
                Open-source self-hosted mail delivery server bypassing recurring SaaS charges.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
              {/* Card 1: Server Status */}
              <div style={{ backgroundColor: '#141418', border: '1px solid #1f1f26', borderRadius: '8px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>✉️</span>
                  <span>Mail Server Configuration</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1f1f24', paddingBottom: '0.5rem' }}>
                    <span style={{ color: '#a1a1aa' }}>Provider</span>
                    <strong style={{ color: '#fff' }}>{postalStatus.provider}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1f1f24', paddingBottom: '0.5rem' }}>
                    <span style={{ color: '#a1a1aa' }}>Server Host</span>
                    <span style={{ color: '#d6af71', fontFamily: 'monospace' }}>{postalStatus.serverHost}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1f1f24', paddingBottom: '0.5rem' }}>
                    <span style={{ color: '#a1a1aa' }}>From Address</span>
                    <span style={{ color: '#fff', fontFamily: 'monospace' }}>{postalStatus.fromEmail}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1f1f24', paddingBottom: '0.5rem' }}>
                    <span style={{ color: '#a1a1aa' }}>Third-Party SaaS Cost</span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>{postalStatus.monthlyFee}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: DNS Records Verification */}
              <div style={{ backgroundColor: '#141418', border: '1px solid #1f1f26', borderRadius: '8px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🛡️</span>
                  <span>DNS Cryptographic Verification</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f1f24', paddingBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>DKIM (DomainKeys Identified Mail)</div>
                      <div style={{ fontSize: '0.7rem', color: '#71717a' }}>RSA-2048 Bit Digital Signature</div>
                    </div>
                    <span style={{ fontSize: '0.7rem', backgroundColor: '#064e3b', color: '#6ee7b7', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                      ✓ Verified
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f1f24', paddingBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>SPF (Sender Policy Framework)</div>
                      <div style={{ fontSize: '0.7rem', color: '#71717a' }}>v=spf1 include:spf.postal.bespokebookings.co.uk ~all</div>
                    </div>
                    <span style={{ fontSize: '0.7rem', backgroundColor: '#064e3b', color: '#6ee7b7', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                      ✓ Verified
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f1f24', paddingBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>MX Inbound Routing</div>
                      <div style={{ fontSize: '0.7rem', color: '#71717a' }}>mx.bespokebookings.co.uk (Priority 10)</div>
                    </div>
                    <span style={{ fontSize: '0.7rem', backgroundColor: '#064e3b', color: '#6ee7b7', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                      ✓ Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================== MODAL: ADD WALK-IN BOOKING ==================== */}
      {isWalkInModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: '#16161b',
            border: '1px solid #2a2a34',
            borderRadius: '12px',
            maxWidth: '540px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff', textTransform: 'uppercase' }}>
                ✂️ New Walk-In / Phone Booking
              </h3>
              <button
                type="button"
                onClick={() => setIsWalkInModalOpen(false)}
                style={{ backgroundColor: 'transparent', color: '#a1a1aa', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {walkInError && (
              <div style={{ backgroundColor: '#450a0a', color: '#fca5a5', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem', border: '1px solid #7f1d1d' }}>
                {walkInError}
              </div>
            )}

            <form onSubmit={handleCreateWalkIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Branch</label>
                  <select
                    value={walkInBranch}
                    onChange={(e) => setWalkInBranch(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#202027', color: '#fff', border: '1px solid #33333f', padding: '0.5rem', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="soho">Crown &amp; Blade — Soho</option>
                    <option value="shoreditch">Crown &amp; Blade — Shoreditch</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Assigned Barber Chair</label>
                  <select
                    value={walkInStaffId}
                    onChange={(e) => setWalkInStaffId(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#202027', color: '#fff', border: '1px solid #33333f', padding: '0.5rem', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    {staffList.filter((s) => s.id !== 'staff-any').map((s) => (
                      <option key={s.id} value={s.id}>{s.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer Booking Preference Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.35rem' }}>
                  Customer Barber Preference
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setWalkInIsAnyBarber(false)}
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      border: !walkInIsAnyBarber ? '1.5px solid #d6af71' : '1px solid #2d2d38',
                      backgroundColor: !walkInIsAnyBarber ? 'rgba(214, 175, 113, 0.15)' : '#202027',
                      color: !walkInIsAnyBarber ? '#d6af71' : '#a1a1aa',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>★</span>
                      <span>Requested Barber</span>
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 400, opacity: 0.85 }}>
                      Client requested this barber specifically
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWalkInIsAnyBarber(true)}
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      border: walkInIsAnyBarber ? '1.5px solid #38bdf8' : '1px solid #2d2d38',
                      backgroundColor: walkInIsAnyBarber ? 'rgba(56, 189, 248, 0.15)' : '#202027',
                      color: walkInIsAnyBarber ? '#38bdf8' : '#a1a1aa',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>🎲</span>
                      <span>Any Barber (Pool)</span>
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 400, opacity: 0.85 }}>
                      Flexible queue; chairs can rebalance
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Service</label>
                <select
                  value={walkInServiceId}
                  onChange={(e) => setWalkInServiceId(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#202027', color: '#fff', border: '1px solid #33333f', padding: '0.5rem', borderRadius: '6px', fontSize: '0.85rem' }}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({formatPence(s.priceInPence)} • {s.durationMinutes}m)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Date</label>
                  <input
                    type="date"
                    required
                    value={walkInDate}
                    onChange={(e) => setWalkInDate(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#202027', color: '#fff', border: '1px solid #33333f', padding: '0.5rem', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Time</label>
                  <input
                    type="time"
                    required
                    value={walkInTime}
                    onChange={(e) => setWalkInTime(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#202027', color: '#fff', border: '1px solid #33333f', padding: '0.5rem', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={walkInCustomerName}
                    onChange={(e) => setWalkInCustomerName(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#202027', color: '#fff', border: '1px solid #33333f', padding: '0.5rem', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 07700 900123"
                    value={walkInCustomerPhone}
                    onChange={(e) => setWalkInCustomerPhone(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#202027', color: '#fff', border: '1px solid #33333f', padding: '0.5rem', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Email (Optional for receipts)</label>
                <input
                  type="email"
                  placeholder="client@example.com"
                  value={walkInCustomerEmail}
                  onChange={(e) => setWalkInCustomerEmail(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#202027', color: '#fff', border: '1px solid #33333f', padding: '0.5rem', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Notes</label>
                <input
                  type="text"
                  value={walkInNotes}
                  onChange={(e) => setWalkInNotes(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#202027', color: '#fff', border: '1px solid #33333f', padding: '0.5rem', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsWalkInModalOpen(false)}
                  style={{ backgroundColor: '#27272a', color: '#d4d4d8', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walkInSubmitting}
                  style={{
                    backgroundColor: '#d6af71',
                    color: '#0f0f11',
                    border: 'none',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {walkInSubmitting ? 'Checking Availability...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* APPOINTMENT DETAIL & REASSIGNMENT MODAL                    */}
      {/* ========================================================= */}
      {selectedAppointmentForModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: '#16161c',
            border: '1px solid #2a2a36',
            borderRadius: '12px',
            maxWidth: '560px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff', textTransform: 'uppercase' }}>
                    ✂️ Appointment Details
                  </h3>
                  <span style={{
                    backgroundColor: '#272732',
                    color: '#d6af71',
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                  }}>
                    {selectedAppointmentForModal.referenceCode}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.2rem' }}>
                  {selectedAppointmentForModal.branchName} • {formatTime(selectedAppointmentForModal.startsAt)} - {formatTime(selectedAppointmentForModal.endsAt)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppointmentForModal(null)}
                style={{ backgroundColor: 'transparent', color: '#a1a1aa', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Clear Preference Distinction Banner */}
            {selectedAppointmentForModal.isAnyBarber ? (
              <div style={{
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>🎲</span>
                  <span>CUSTOMER BOOKING PREFERENCE: ANY AVAILABLE BARBER</span>
                </div>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: '#bae6fd', lineHeight: 1.45 }}>
                  The customer did <strong>not</strong> select a specific barber when booking. They are in the flexible queue and can be safely reallocated to any available chair without disappointing customer loyalty.
                </p>
              </div>
            ) : (
              <div style={{
                backgroundColor: 'rgba(214, 175, 113, 0.12)',
                border: '1px solid rgba(214, 175, 113, 0.35)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ color: '#d6af71', fontWeight: 800, fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>★</span>
                  <span>CUSTOMER BOOKING PREFERENCE: SPECIFIC BARBER REQUESTED</span>
                </div>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: '#fef3c7', lineHeight: 1.45 }}>
                  The customer specifically requested <strong>{selectedAppointmentForModal.staffName}</strong>. Please retain this chair assignment unless the barber is unavailable, and notify the customer if reassigning.
                </p>
              </div>
            )}

            {/* Appointment Details Grid */}
            <div style={{
              backgroundColor: '#1b1b22',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.25rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.85rem',
              fontSize: '0.825rem',
            }}>
              <div>
                <span style={{ color: '#71717a', fontSize: '0.7rem', display: 'block', textTransform: 'uppercase' }}>Customer</span>
                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{selectedAppointmentForModal.customerName}</strong>
                <div style={{ marginTop: '0.2rem' }}>
                  <a href={`tel:${selectedAppointmentForModal.customerPhone}`} style={{ color: '#d6af71', textDecoration: 'none', fontSize: '0.78rem' }}>
                    📞 {selectedAppointmentForModal.customerPhone}
                  </a>
                </div>
                {selectedAppointmentForModal.customerEmail && (
                  <div style={{ color: '#a1a1aa', fontSize: '0.72rem', marginTop: '0.1rem' }}>
                    ✉️ {selectedAppointmentForModal.customerEmail}
                  </div>
                )}
              </div>

              <div>
                <span style={{ color: '#71717a', fontSize: '0.7rem', display: 'block', textTransform: 'uppercase' }}>Service & Price</span>
                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{selectedAppointmentForModal.serviceName}</strong>
                <div style={{ color: '#d6af71', fontWeight: 700, marginTop: '0.2rem' }}>
                  {formatPence(selectedAppointmentForModal.finalPriceInPence)}
                  <span style={{ color: '#71717a', fontWeight: 400, marginLeft: '0.4rem' }}>
                    ({selectedAppointmentForModal.durationMinutes} mins)
                  </span>
                </div>
                {selectedAppointmentForModal.discountApplied && (
                  <span style={{ fontSize: '0.65rem', backgroundColor: '#064e3b', color: '#6ee7b7', padding: '0.1rem 0.35rem', borderRadius: '3px', fontWeight: 700, display: 'inline-block', marginTop: '0.2rem' }}>
                    10% DISCOUNT
                  </span>
                )}
              </div>

              {selectedAppointmentForModal.notes && (
                <div style={{ gridColumn: 'span 2', backgroundColor: '#141418', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', color: '#a1a1aa' }}>
                  <span style={{ color: '#71717a', fontWeight: 600 }}>Notes:</span> &ldquo;{selectedAppointmentForModal.notes}&rdquo;
                </div>
              )}
            </div>

            {/* Barber Reassignment Section */}
            <div style={{
              border: '1px solid #2d2d3a',
              backgroundColor: '#131317',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f4f4f5', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  🔄 Reassign Chair / Barber
                </span>
                <span style={{ fontSize: '0.7rem', color: '#71717a' }}>
                  Current: <strong style={{ color: '#fff' }}>{selectedAppointmentForModal.staffName}</strong>
                </span>
              </div>

              {reassignError && (
                <div style={{
                  backgroundColor: '#450a0a',
                  color: '#fca5a5',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  marginBottom: '0.75rem',
                  border: '1px solid #7f1d1d',
                }}>
                  ⚠️ {reassignError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  value={reassignTargetStaffId}
                  onChange={(e) => setReassignTargetStaffId(e.target.value)}
                  style={{
                    flex: 1,
                    backgroundColor: '#1f1f27',
                    color: '#fff',
                    border: '1px solid #333342',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.825rem',
                  }}
                >
                  {activeBranchBarbers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.role === 'owner' ? 'Owner' : s.role === 'manager' ? 'Manager' : 'Barber'}) {s.id === selectedAppointmentForModal.staffId ? '• (Current)' : ''}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleReassignBarber}
                  disabled={reassignLoading || reassignTargetStaffId === selectedAppointmentForModal.staffId}
                  style={{
                    backgroundColor: reassignTargetStaffId === selectedAppointmentForModal.staffId ? '#272730' : '#d6af71',
                    color: reassignTargetStaffId === selectedAppointmentForModal.staffId ? '#71717a' : '#0f0f12',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.55rem 1rem',
                    cursor: reassignTargetStaffId === selectedAppointmentForModal.staffId ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {reassignLoading ? 'Checking...' : 'Move Chair'}
                </button>
              </div>
            </div>

            {/* Quick Status Updates & Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {selectedAppointmentForModal.status === 'confirmed' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedAppointmentForModal.id, 'completed')}
                      style={{
                        backgroundColor: '#064e3b',
                        color: '#6ee7b7',
                        border: '1px solid #059669',
                        padding: '0.45rem 0.8rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ✓ Complete Cut
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedAppointmentForModal.id, 'no_show')}
                      style={{
                        backgroundColor: '#27272a',
                        color: '#a1a1aa',
                        border: '1px solid #3f3f46',
                        padding: '0.45rem 0.7rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      No-Show
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedAppointmentForModal.id, 'cancelled')}
                      style={{
                        backgroundColor: '#450a0a',
                        color: '#fca5a5',
                        border: '1px solid #7f1d1d',
                        padding: '0.45rem 0.7rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </>
                )}
                {selectedAppointmentForModal.status === 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedAppointmentForModal.id, 'confirmed')}
                    style={{
                      backgroundColor: '#27272a',
                      color: '#d4d4d8',
                      border: '1px solid #3f3f46',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Restore to Confirmed
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedAppointmentForModal(null)}
                style={{
                  backgroundColor: '#27272a',
                  color: '#d4d4d8',
                  border: 'none',
                  padding: '0.45rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
