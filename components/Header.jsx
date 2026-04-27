'use client';

import Link from 'next/link';

export default function Header({ user, onOpenMenu }) {
  return (
    <header className="topbar">
      <Link className="brand" href="/">MySecret</Link>

      <nav className="desktop-nav" aria-label="ניווט ראשי">
        <Link href="/">פיד</Link>
        {user && <Link href="/search">חיפוש</Link>}
        {user && <Link href="/notifications">התראות</Link>}
      </nav>

      <button className="menu-toggle" type="button" onClick={onOpenMenu} aria-label="תפריט">
        <span />
        <span />
        <span />
      </button>
    </header>
  );
}
