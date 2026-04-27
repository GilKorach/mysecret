'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import AuthOnboardingModal from '@/components/AuthOnboardingModal';
import CreateSecretModal from '@/components/CreateSecretModal';
import FloatingWriteButton from '@/components/FloatingWriteButton';
import Header from '@/components/Header';
import MobileMenu from '@/components/MobileMenu';
import { api } from '@/lib/api';
import { AUTH_MODAL_EVENT } from '@/lib/auth-modal';

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

  const overlayOpen = authOpen || composeOpen || menuOpen;

  return (
    <div className={`app-shell ${overlayOpen ? 'modal-open' : ''}`}>
      <div className="shell-content">
        <Header user={user} onOpenMenu={() => setMenuOpen(true)} />
        {children}
        {pathname !== '/create' && <FloatingWriteButton onClick={() => setComposeOpen(true)} />}
      </div>

      <MobileMenu
        open={menuOpen}
        user={user}
        onClose={() => setMenuOpen(false)}
        onOpenLogin={() => { setAuthMode('login'); setAuthOpen(true); }}
        onOpenSignup={() => { setAuthMode('signup'); setAuthOpen(true); }}
        onLogout={logout}
        onOpenComposer={() => setComposeOpen(true)}
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
