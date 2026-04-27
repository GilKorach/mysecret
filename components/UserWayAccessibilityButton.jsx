'use client';

import { useEffect, useState } from 'react';

const USERWAY_ACCOUNT = process.env.NEXT_PUBLIC_USERWAY_ACCOUNT || '0wrwyRdaFX';
const USERWAY_LANG = process.env.NEXT_PUBLIC_USERWAY_LANG || 'he';
const USERWAY_STATEMENT_URL =
  process.env.NEXT_PUBLIC_USERWAY_STATEMENT_URL ||
  'https://arenadeal.com/%d7%94%d7%a6%d7%94%d7%a8%d7%aa-%d7%a0%d7%92%d7%99%d7%a9%d7%95%d7%aa/';
const USERWAY_STATEMENT_TEXT =
  process.env.NEXT_PUBLIC_USERWAY_STATEMENT_TEXT || 'הצהרת נגישות';
const SHOW_DELAY_MS = 3000;

function hideBuiltInUserWayIcon() {
  const styleId = 'userway-hide-default-icon';
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    #userwayAccessibilityIcon,
    .uwy.userway_p1,
    .uwy.userway_p2 {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;

  (document.head || document.documentElement).appendChild(style);
}

function attachScriptAttributes(script) {
  script.setAttribute('data-account', USERWAY_ACCOUNT);
  script.setAttribute('data-lang', USERWAY_LANG);

  if (USERWAY_STATEMENT_URL) {
    script.setAttribute('data-statement_url', USERWAY_STATEMENT_URL);
  }

  if (USERWAY_STATEMENT_TEXT) {
    script.setAttribute('data-statement_text', USERWAY_STATEMENT_TEXT);
  }
}

export default function UserWayAccessibilityButton() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(true);
    }, SHOW_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    hideBuiltInUserWayIcon();
  }, [loaded]);

  useEffect(() => {
    const onInitCompleted = (event) => {
      const instance = event?.detail?.userWayInstance || window.UserWay;
      try {
        instance?.iconVisibilityOff?.();
        instance?.widgetOpen?.();
      } catch {
        // Best effort only.
      }
      setLoaded(true);
      setLoading(false);
    };

    document.addEventListener('userway:init_completed', onInitCompleted, { once: true });
    return () => {
      document.removeEventListener('userway:init_completed', onInitCompleted);
    };
  }, []);

  const openOrLoadWidget = () => {
    if (!USERWAY_ACCOUNT) {
      return;
    }

    if (window.UserWay?.widgetToggle) {
      window.UserWay.widgetToggle();
      return;
    }

    if (loading) {
      return;
    }

    const existingScript = document.querySelector('script[src="https://cdn.userway.org/widget.js"]');
    if (existingScript) {
      setLoading(true);
      return;
    }

    setLoading(true);
    const script = document.createElement('script');
    script.src = 'https://cdn.userway.org/widget.js';
    script.async = true;
    attachScriptAttributes(script);
    script.onerror = () => {
      setLoading(false);
    };

    (document.head || document.documentElement).appendChild(script);
  };

  const buttonClassName = `userway-launcher ${loading ? 'loading' : ''}`.trim();

  return (
    <>
      <style jsx>{`
        .userway-launcher {
          position: fixed;
          left: 20px;
          bottom: 20px;
          z-index: 2147483646;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border: 0;
          border-radius: 999px;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
          background: #0a66c2;
          color: #ffffff;
        }

        .userway-launcher:focus-visible {
          outline: 3px solid rgba(10, 102, 194, 0.35);
          outline-offset: 3px;
        }

        .userway-launcher:disabled {
          opacity: 0.75;
          cursor: progress;
        }

        .userway-launcher svg {
          width: 18px;
          height: 18px;
        }

        .userway-launcher.loading::after {
          content: '';
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.55);
          border-top-color: rgba(255, 255, 255, 1);
          border-radius: 50%;
          margin-right: 8px;
          animation: uwspin 0.9s linear infinite;
        }

        @keyframes uwspin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 480px) {
          .userway-launcher {
            left: 14px;
            bottom: 14px;
            width: 46px;
            height: 46px;
          }
        }
      `}</style>

      {visible && (
        <button
          id="uw-launcher-he"
          type="button"
          aria-label="Open accessibility menu"
          className={buttonClassName}
          disabled={loading}
          aria-busy={loading || undefined}
          onClick={openOrLoadWidget}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M12 2a2 2 0 1 0 0 4a2 2 0 0 0 0-4Zm-9 7a1 1 0 0 1 1-1h16a1 1 0 1 1 0 2h-6v12a1 1 0 1 1-2 0v-6h-2v6a1 1 0 1 1-2 0V10H4a1 1 0 0 1-1-1Z"
            />
          </svg>
        </button>
      )}
    </>
  );
}
