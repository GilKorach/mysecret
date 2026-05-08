'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import AuthOnboardingModal from '@/components/AuthOnboardingModal';
import CreateSecretModal from '@/components/CreateSecretModal';
import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import MobileMenu from '@/components/MobileMenu';
import { api } from '@/lib/api';
import { AUTH_MODAL_EVENT } from '@/lib/auth-modal';
import { COMPOSER_MODAL_EVENT } from '@/lib/composer-modal';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('onboarding');
  const [composeOpen, setComposeOpen] = useState(false);
  const onSuccessRef = useRef(null);

  useEffect(() => {
    let active = true;

    api('/api/auth/me')
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active) setUser(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleOpen(event) {
      const detail = event.detail || {};
      const nextMode = ['login', 'signup', 'onboarding'].includes(detail.mode) ? detail.mode : 'onboarding';
      setAuthMode(nextMode);
      onSuccessRef.current = typeof detail.onSuccess === 'function' ? detail.onSuccess : null;
      setAuthOpen(true);
    }

    window.addEventListener(AUTH_MODAL_EVENT, handleOpen);
    return () => window.removeEventListener(AUTH_MODAL_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    function handleOpenComposer() {
      if (user) {
        setComposeOpen(true);
        return;
      }

      setAuthMode('login');
      onSuccessRef.current = () => setComposeOpen(true);
      setAuthOpen(true);
    }

    window.addEventListener(COMPOSER_MODAL_EVENT, handleOpenComposer);
    return () => window.removeEventListener(COMPOSER_MODAL_EVENT, handleOpenComposer);
  }, [user]);

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }

  function handleAuthSuccess(nextUser) {
    setUser(nextUser);
    const callback = onSuccessRef.current;
    onSuccessRef.current = null;
    callback?.(nextUser);
  }

  function closeAuthModal() {
    setAuthOpen(false);
    onSuccessRef.current = null;
  }

  function openComposerGuarded() {
    if (user) {
      setComposeOpen(true);
      return;
    }

    setAuthMode('login');
    onSuccessRef.current = () => setComposeOpen(true);
    setAuthOpen(true);
  }

  const overlayOpen = authOpen || composeOpen || menuOpen;
  const shellClassName = [
    'app-shell',
    overlayOpen ? 'modal-open' : '',
    pathname !== '/create' ? 'has-mobile-nav' : ''
  ].filter(Boolean).join(' ');

  useEffect(() => {
    if (!overlayOpen) return undefined;

    const scrollY = window.scrollY;
    const previous = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width
    };

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = previous.overflow;
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, [overlayOpen]);

  return (
    <div className={shellClassName}>
      <div className="shell-content">
        <Header
          user={user}
          onOpenMenu={() => setMenuOpen(true)}
          onOpenLogin={() => { setAuthMode('login'); setAuthOpen(true); }}
          onOpenSignup={() => { setAuthMode('signup'); setAuthOpen(true); }}
          onLogout={logout}
        />
        {children}
      </div>

      {!overlayOpen && pathname !== '/create' && (
        <MobileBottomNav
          user={user}
          onOpenMenu={() => setMenuOpen(true)}
          onOpenLogin={() => { setAuthMode('login'); setAuthOpen(true); }}
          onOpenComposer={openComposerGuarded}
        />
      )}

      <MobileMenu
        open={menuOpen}
        user={user}
        onClose={() => setMenuOpen(false)}
        onOpenLogin={() => { setAuthMode('login'); setAuthOpen(true); }}
        onOpenSignup={() => { setAuthMode('signup'); setAuthOpen(true); }}
        onLogout={logout}
        onOpenComposer={openComposerGuarded}
      />

      <CreateSecretModal open={composeOpen} onClose={() => setComposeOpen(false)} />

      <AuthOnboardingModal
        open={authOpen}
        mode={authMode}
        onClose={closeAuthModal}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
