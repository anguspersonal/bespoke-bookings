/**
 * Bespoke Bookings Embed Loader & Lightbox Widget
 * Supports:
 *  1. Inline embed inside <div id="bespoke-booking">
 *  2. Modal Lightbox triggered by data-bespoke-modal or .bespoke-book-btn
 *  3. Floating "Book Now" Action Button (FAB)
 *  4. GA4 / Meta Pixel / Custom Event dataLayer integration
 *  5. Global window.BespokeBookings API
 */

export interface BespokeModalOptions {
  shop?: string;
  branch?: string;
  host?: string;
  serviceId?: string;
}

(function () {
  if (typeof window === 'undefined') return;

  const DEFAULT_HOST = 'https://platform.bespokebookings.co.uk';
  const DEFAULT_SHOP = 'soho';

  // Find script element to read configuration attributes
  const currentScript =
    document.currentScript ||
    document.querySelector('script[src*="widget.js"]') ||
    document.querySelector('script[data-bespoke-host]');

  const defaultBaseHost =
    currentScript?.getAttribute('data-bespoke-host') ||
    currentScript?.getAttribute('data-host') ||
    (window.location.hostname === 'localhost' ? 'http://localhost:3000' : DEFAULT_HOST);

  const defaultShop =
    currentScript?.getAttribute('data-bespoke-shop') ||
    currentScript?.getAttribute('data-shop') ||
    DEFAULT_SHOP;

  const enableFloating =
    currentScript?.getAttribute('data-bespoke-floating') === 'true' ||
    currentScript?.getAttribute('data-floating') === 'true';

  // Inject Scoped Widget Styles
  function injectStyles() {
    if (document.getElementById('bespoke-widget-styles')) return;

    const style = document.createElement('style');
    style.id = 'bespoke-widget-styles';
    style.textContent = `
      /* Bespoke Bookings Modal Backdrop */
      .bespoke-backdrop {
        position: fixed;
        inset: 0;
        z-index: 999999;
        background: rgba(0, 0, 0, 0.82);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.28s;
        padding: 16px;
        box-sizing: border-box;
      }
      .bespoke-backdrop.bespoke-active {
        opacity: 1;
        visibility: visible;
      }

      /* Modal Dialog Box */
      .bespoke-modal-dialog {
        position: relative;
        width: 100%;
        max-width: 580px;
        max-height: 94vh;
        background: #0f0f11;
        border: 1px solid #27272a;
        border-radius: 16px;
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 40px rgba(214, 175, 113, 0.12);
        overflow: hidden;
        transform: translateY(24px) scale(0.96);
        transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
      }
      .bespoke-backdrop.bespoke-active .bespoke-modal-dialog {
        transform: translateY(0) scale(1);
      }

      /* Close Button */
      .bespoke-close-btn {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.14);
        color: #f4f4f5;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 20px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 20;
        transition: all 0.2s ease;
        padding: 0;
      }
      .bespoke-close-btn:hover {
        background: rgba(214, 175, 113, 0.25);
        color: #d6af71;
        border-color: #d6af71;
        transform: scale(1.08);
      }

      /* Modal Iframe */
      .bespoke-modal-iframe {
        width: 100%;
        height: 690px;
        max-height: calc(94vh - 20px);
        border: none;
        display: block;
        background: #0f0f11;
      }

      /* Floating Action Button (FAB) */
      .bespoke-floating-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 99998;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 13px 22px;
        background: linear-gradient(135deg, #d6af71 0%, #c49957 100%);
        color: #0c0c0e;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        border-radius: 50px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        cursor: pointer;
        box-shadow: 0 10px 25px -5px rgba(214, 175, 113, 0.45), 0 0 15px rgba(214, 175, 113, 0.25);
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        text-decoration: none;
        user-select: none;
      }
      .bespoke-floating-btn:hover {
        transform: translateY(-3px) scale(1.03);
        box-shadow: 0 16px 32px -6px rgba(214, 175, 113, 0.6), 0 0 25px rgba(214, 175, 113, 0.35);
        background: linear-gradient(135deg, #e0be86 0%, #d6af71 100%);
      }
      .bespoke-floating-btn:active {
        transform: translateY(0) scale(0.98);
      }
      .bespoke-floating-pulse {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #0c0c0e;
        display: inline-block;
        animation: bespoke-pulse 2s infinite;
      }
      @keyframes bespoke-pulse {
        0% { transform: scale(0.95); opacity: 0.8; }
        50% { transform: scale(1.3); opacity: 1; }
        100% { transform: scale(0.95); opacity: 0.8; }
      }
    `;
    document.head.appendChild(style);
  }

  // Active elements
  let activeModalBackdrop: HTMLElement | null = null;
  let activeModalIframe: HTMLIFrameElement | null = null;
  let previousBodyOverflow = '';

  // Open Lightbox Modal
  function openModal(options?: BespokeModalOptions) {
    injectStyles();

    const shop = options?.shop || options?.branch || defaultShop;
    const host = options?.host || defaultBaseHost;
    const cleanHost = host.replace(/\/$/, '');
    
    let iframeUrl = `${cleanHost}/embed/${encodeURIComponent(shop)}?modal=1`;
    if (options?.serviceId) {
      iframeUrl += `&service=${encodeURIComponent(options.serviceId)}`;
    }

    if (!activeModalBackdrop) {
      const backdrop = document.createElement('div');
      backdrop.className = 'bespoke-backdrop';
      backdrop.setAttribute('role', 'dialog');
      backdrop.setAttribute('aria-modal', 'true');

      const dialog = document.createElement('div');
      dialog.className = 'bespoke-modal-dialog';

      const closeBtn = document.createElement('button');
      closeBtn.className = 'bespoke-close-btn';
      closeBtn.setAttribute('aria-label', 'Close booking window');
      closeBtn.innerHTML = '×';
      closeBtn.onclick = closeModal;

      const iframe = document.createElement('iframe');
      iframe.className = 'bespoke-modal-iframe';
      iframe.setAttribute('title', 'Book Appointment');
      iframe.setAttribute('loading', 'eager');
      iframe.src = iframeUrl;

      dialog.appendChild(closeBtn);
      dialog.appendChild(iframe);
      backdrop.appendChild(dialog);

      // Close on backdrop outside click
      backdrop.onclick = (e) => {
        if (e.target === backdrop) closeModal();
      };

      document.body.appendChild(backdrop);
      activeModalBackdrop = backdrop;
      activeModalIframe = iframe;
    } else if (activeModalIframe && activeModalIframe.src !== iframeUrl) {
      activeModalIframe.src = iframeUrl;
    }

    // Lock body scroll
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Trigger transition
    requestAnimationFrame(() => {
      activeModalBackdrop?.classList.add('bespoke-active');
    });
  }

  // Close Lightbox Modal
  function closeModal() {
    if (!activeModalBackdrop) return;

    activeModalBackdrop.classList.remove('bespoke-active');
    document.body.style.overflow = previousBodyOverflow;

    setTimeout(() => {
      if (activeModalBackdrop && !activeModalBackdrop.classList.contains('bespoke-active')) {
        activeModalBackdrop.remove();
        activeModalBackdrop = null;
        activeModalIframe = null;
      }
    }, 300);
  }

  // Handle ESC key to close modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeModalBackdrop?.classList.contains('bespoke-active')) {
      closeModal();
    }
  });

  // Initialize Inline Embeds
  function initInlineEmbeds() {
    const inlineContainers = document.querySelectorAll(
      '#bespoke-booking, [data-bespoke-inline], .bespoke-booking-container'
    );

    inlineContainers.forEach((container) => {
      // Avoid double-initialization
      if (container.getAttribute('data-bespoke-initialized') === 'true') return;

      const shopSlug = container.getAttribute('data-shop') || container.getAttribute('data-branch') || defaultShop;
      const hostUrl = container.getAttribute('data-host') || defaultBaseHost;
      const cleanHost = hostUrl.replace(/\/$/, '');
      const iframeUrl = `${cleanHost}/embed/${encodeURIComponent(shopSlug)}`;

      const iframe = document.createElement('iframe');
      iframe.src = iframeUrl;
      iframe.style.width = '100%';
      iframe.style.minHeight = '650px';
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      iframe.style.display = 'block';
      iframe.setAttribute('title', 'Book Appointment');
      iframe.setAttribute('loading', 'lazy');

      container.innerHTML = '';
      container.appendChild(iframe);
      container.setAttribute('data-bespoke-initialized', 'true');
    });
  }

  // Initialize Trigger Elements
  function initTriggerElements() {
    document.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement)?.closest(
        '[data-bespoke-modal], [data-bespoke-open], .bespoke-book-btn, .bespoke-book-button'
      ) as HTMLElement | null;

      if (!target) return;

      e.preventDefault();
      const shop = target.getAttribute('data-shop') || target.getAttribute('data-branch') || defaultShop;
      const host = target.getAttribute('data-host') || defaultBaseHost;
      const serviceId = target.getAttribute('data-service') || undefined;

      openModal({ shop, host, serviceId });
    });
  }

  // Initialize Floating Button
  function initFloatingButton() {
    if (!enableFloating && !document.querySelector('[data-bespoke-floating="true"]')) {
      return;
    }
    if (document.getElementById('bespoke-floating-action-button')) return;

    injectStyles();

    const btn = document.createElement('button');
    btn.id = 'bespoke-floating-action-button';
    btn.className = 'bespoke-floating-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Open online booking');
    btn.innerHTML = `
      <span class="bespoke-floating-pulse"></span>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      <span>Book Appointment</span>
    `;

    btn.onclick = () => openModal({ shop: defaultShop, host: defaultBaseHost });
    document.body.appendChild(btn);
  }

  // Handle postMessage Events from Embed Iframes
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    // 1. Dynamic Height Resizing
    if (data.type === 'BESPOKE_RESIZE' && typeof data.height === 'number') {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((ifr) => {
        if (ifr.contentWindow === event.source) {
          ifr.style.height = `${data.height}px`;
        }
      });
    }

    // 2. Close Modal Request from within iframe
    if (data.type === 'BESPOKE_CLOSE_MODAL') {
      closeModal();
    }

    // 3. Booking Completed Event Callback (Analytics / GA4)
    if (data.type === 'BESPOKE_BOOKING_COMPLETED' && data.booking) {
      // Fire custom DOM event for host website scripts
      const customEvent = new CustomEvent('bespoke:booking_completed', {
        detail: data.booking,
        bubbles: true,
      });
      window.dispatchEvent(customEvent);

      // Google Tag Manager / GA4 integration
      const gtm = (window as any).dataLayer;
      if (Array.isArray(gtm)) {
        gtm.push({
          event: 'bespoke_booking_completed',
          booking_reference: data.booking.referenceCode,
          service_name: data.booking.serviceName,
          barber_name: data.booking.staffName,
          branch_name: data.booking.branchName,
          value: (data.booking.finalPriceInPence || 0) / 100,
          currency: 'GBP',
        });
      }
    }

    // 4. Step Change Smooth Scroll
    if (data.type === 'BESPOKE_STEP_CHANGE') {
      const inline = document.getElementById('bespoke-booking');
      if (inline && !activeModalBackdrop?.classList.contains('bespoke-active')) {
        const rect = inline.getBoundingClientRect();
        if (rect.top < 0 || rect.top > window.innerHeight * 0.4) {
          inline.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  });

  // Global API
  const api = {
    openModal,
    closeModal,
    init: () => {
      injectStyles();
      initInlineEmbeds();
      initTriggerElements();
      initFloatingButton();
    },
    version: '1.1.0',
  };

  (window as any).BespokeBookings = api;

  // Auto-run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => api.init());
  } else {
    api.init();
  }
})();
