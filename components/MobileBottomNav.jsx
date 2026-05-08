'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

function navClass(active) {
  return `mobile-nav-item ${active ? 'active' : ''}`.trim();
}

export default function MobileBottomNav({
  user,
  onOpenMenu,
  onOpenLogin,
  onOpenComposer
}) {
  const pathname = usePathname();
  const router = useRouter();

  function guardedAction(action) {
    if (user) {
      action();
      return;
    }
    onOpenLogin();
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="ניווט מובייל">
      <Link className={navClass(pathname === '/')} href="/">
        <span aria-hidden="true">⌂</span>
        <span>פיד</span>
      </Link>

      <button
        className={navClass(pathname.startsWith('/search'))}
        type="button"
        onClick={() => guardedAction(() => router.push('/search'))}
      >
        <span aria-hidden="true">⌕</span>
        <span>חיפוש</span>
      </button>

      <button className="mobile-compose" type="button" onClick={onOpenComposer} aria-label="כתוב סוד">
        <span aria-hidden="true">+</span>
      </button>

      <button
        className={navClass(pathname.startsWith('/notifications'))}
        type="button"
        onClick={() => user ? router.push('/notifications') : onOpenLogin()}
      >
        <span aria-hidden="true">◔</span>
        <span>{user ? 'התראות' : 'כניסה'}</span>
      </button>

      <button className="mobile-nav-item" type="button" onClick={onOpenMenu}>
        <span aria-hidden="true">☰</span>
        <span>עוד</span>
      </button>
    </nav>
  );
}
