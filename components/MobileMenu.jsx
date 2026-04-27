'use client';

import Link from 'next/link';

export default function MobileMenu({
  open,
  user,
  onClose,
  onOpenLogin,
  onOpenSignup,
  onLogout,
  onOpenComposer
}) {
  if (!open) return null;

  return (
    <div className="menu-layer" role="dialog" aria-modal="true" aria-label="תפריט ראשי">
      <button className="menu-backdrop" type="button" aria-label="סגירה" onClick={onClose} />
      <aside className="menu-panel">
        <div className="menu-head">
          <strong>{user ? `היי ${user.nickname}` : 'ברוכים הבאים'}</strong>
          <button type="button" className="auth-close" onClick={onClose} aria-label="סגירה">×</button>
        </div>

        <nav className="menu-links" aria-label="ניווט">
          <Link href="/" onClick={onClose}>פיד</Link>
          {user && <Link href="/search" onClick={onClose}>חיפוש</Link>}
          {user && <Link href="/notifications" onClick={onClose}>התראות</Link>}
          {user && <Link href={`/profile/${user.id}`} onClick={onClose}>פרופיל והגדרות</Link>}
        </nav>

        <div className="menu-actions">
          <button className="btn primary" type="button" onClick={() => { onOpenComposer(); onClose(); }}>
            + כתוב סוד
          </button>

          {!user && (
            <>
              <button className="btn" type="button" onClick={() => { onOpenLogin(); onClose(); }}>התחברות</button>
              <button className="btn" type="button" onClick={() => { onOpenSignup(); onClose(); }}>הרשמה</button>
            </>
          )}

          {user && (
            <button className="btn" type="button" onClick={() => { onLogout(); onClose(); }}>התנתקות</button>
          )}
        </div>
      </aside>
    </div>
  );
}
