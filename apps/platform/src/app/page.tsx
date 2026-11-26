'use client';

import React, { useState } from 'react';

export default function PlatformShowcasePage() {
  const [activeView, setActiveView] = useState<'mobile' | 'desktop' | 'admin'>('mobile');
  const [selectedBranch, setSelectedBranch] = useState<'soho' | 'shoreditch'>('soho');

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#09090b',
        color: '#f4f4f5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Banner: Value Proposition */}
      <div
        style={{
          backgroundColor: '#141418',
          borderBottom: '1px solid #22222a',
          padding: '0.6rem 1rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#a1a1aa',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ color: '#d6af71', fontWeight: 700 }}>★ BESPOKE BOOKINGS DEMO</span>
        <span style={{ color: '#3f3f46' }}>•</span>
        <span>Demo Tenant: Crown & Blade Barbers (Soho & Shoreditch)</span>
        <span style={{ color: '#3f3f46' }}>•</span>
        <span style={{ color: '#34d399', fontWeight: 600 }}>0% Commission vs Fresha&apos;s 20% Tax</span>
      </div>

      {/* Main Header */}
      <header
        style={{
          borderBottom: '1px solid #1a1a20',
          padding: '1rem 1.5rem',
          backgroundColor: '#0c0c0e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: '#18181c',
              border: '1px solid #d6af71',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
            }}
          >
            💈
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
              Crown & Blade Barbers
            </h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#8e8e99' }}>
              Interactive Booking Engine & Counter Portal Demo
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#141417',
            padding: '4px',
            borderRadius: '8px',
            border: '1px solid #27272a',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveView('mobile')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeView === 'mobile' ? '#d6af71' : 'transparent',
              color: activeView === 'mobile' ? '#09090b' : '#a1a1aa',
              transition: 'all 0.15s ease',
            }}
          >
            📱 Mobile Client View
          </button>
          <button
            type="button"
            onClick={() => setActiveView('desktop')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeView === 'desktop' ? '#d6af71' : 'transparent',
              color: activeView === 'desktop' ? '#09090b' : '#a1a1aa',
              transition: 'all 0.15s ease',
            }}
          >
            💻 Website Embed View
          </button>
          <button
            type="button"
            onClick={() => setActiveView('admin')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeView === 'admin' ? '#d6af71' : 'transparent',
              color: activeView === 'admin' ? '#09090b' : '#a1a1aa',
              transition: 'all 0.15s ease',
            }}
          >
            📊 Counter iPad / Admin
          </button>
        </div>

        {/* Direct Full-Screen Links */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <a
            href={`/embed/${selectedBranch}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              textDecoration: 'none',
              backgroundColor: '#18181c',
              color: '#d6af71',
              border: '1px solid #2e2e38',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>Client Fullscreen ↗</span>
          </a>
          <a
            href="/admin"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              textDecoration: 'none',
              backgroundColor: '#d6af71',
              color: '#09090b',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>Admin Portal ↗</span>
          </a>
        </div>
      </header>

      {/* Control bar: Branch switcher */}
      <div
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#0e0e11',
          borderBottom: '1px solid #1a1a20',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ color: '#71717a', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Branch:
          </span>
          <button
            type="button"
            onClick={() => setSelectedBranch('soho')}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: selectedBranch === 'soho' ? '1px solid #d6af71' : '1px solid #27272a',
              backgroundColor: selectedBranch === 'soho' ? '#1c1c22' : 'transparent',
              color: selectedBranch === 'soho' ? '#d6af71' : '#a1a1aa',
            }}
          >
            Soho (Brewer Ln)
          </button>
          <button
            type="button"
            onClick={() => setSelectedBranch('shoreditch')}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: selectedBranch === 'shoreditch' ? '1px solid #d6af71' : '1px solid #27272a',
              backgroundColor: selectedBranch === 'shoreditch' ? '#1c1c22' : 'transparent',
              color: selectedBranch === 'shoreditch' ? '#d6af71' : '#a1a1aa',
            }}
          >
            Shoreditch (Redchurch Mews)
          </button>
        </div>

        <div style={{ color: '#71717a', fontSize: '0.75rem' }}>
          💡 Try making a booking in the Client view, then flip to the Counter iPad tab to see it live!
        </div>
      </div>

      {/* Main Stage Viewport */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: activeView === 'mobile' ? 'center' : 'stretch',
          padding: activeView === 'mobile' ? '2rem 1rem' : '0',
          overflow: 'auto',
          backgroundColor: '#08080a',
        }}
      >
        {activeView === 'mobile' && (
          <div
            style={{
              width: '100%',
              maxWidth: '430px',
              height: '840px',
              backgroundColor: '#000',
              borderRadius: '44px',
              border: '10px solid #27272a',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(214, 175, 113, 0.08)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {/* Phone Notch/Island */}
            <div
              style={{
                height: '24px',
                backgroundColor: '#000',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  width: '90px',
                  height: '14px',
                  backgroundColor: '#1f1f23',
                  borderRadius: '10px',
                }}
              />
            </div>

            {/* Iframe inside Mobile Frame */}
            <iframe
              src={`/embed/${selectedBranch}`}
              style={{
                width: '100%',
                flex: 1,
                border: 'none',
                backgroundColor: '#0f0f11',
              }}
              title="Mobile Client Booking Demo"
            />
          </div>
        )}

        {activeView === 'desktop' && (
          <div
            style={{
              width: '100%',
              maxWidth: '820px',
              margin: '2rem auto',
              backgroundColor: '#0f0f11',
              borderRadius: '16px',
              border: '1px solid #27272a',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: '#141418',
                borderBottom: '1px solid #22222a',
                fontSize: '0.8rem',
                color: '#a1a1aa',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#eab308', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
              <span style={{ marginLeft: '1rem', color: '#71717a' }}>crownandblade.example/book-online</span>
            </div>
            <iframe
              src={`/embed/${selectedBranch}`}
              style={{
                width: '100%',
                minHeight: '800px',
                border: 'none',
                display: 'block',
              }}
              title="Desktop Embed Booking Demo"
            />
          </div>
        )}

        {activeView === 'admin' && (
          <div style={{ width: '100%', height: '100%', minHeight: '850px' }}>
            <iframe
              src="/admin"
              style={{
                width: '100%',
                height: '100%',
                minHeight: '850px',
                border: 'none',
                display: 'block',
              }}
              title="Barber Counter Admin Portal Demo"
            />
          </div>
        )}
      </main>
    </div>
  );
}
