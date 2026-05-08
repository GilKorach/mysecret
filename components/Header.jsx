'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'פיד', auth: true },
  { href: '/search', label: 'חיפוש', auth: true },
  { href: '/notifications', label: 'התראות', auth: true }
];

function isActive(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export default function Header({
  user,
  onOpenMenu,
  onOpenLogin,
  onOpenSignup,
  onLogout
}) {
  const pathname = usePathname();

  return (
    <header className="topbar">
      <Link className="brand" href="/">MySecret</Link>

      <nav className="desktop-nav" aria-label="ניווט ראשי">
        {links.map((link) => {
          if (link.auth && !user) return null;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(pathname, link.href) ? 'active' : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="desktop-actions">
        {!user && (
          <>
            <button className="btn compact ghost" type="button" onClick={onOpenLogin}>
              התחברות
            </button>
            <button className="btn compact" type="button" onClick={onOpenSignup}>
              הרשמה
            </button>
          </>
        )}

        {user && (
          <>
            <Link className="profile-chip" href={`/profile/${user.id}`}>
              {user.nickname}
            </Link>
            <button className="btn compact ghost" type="button" onClick={onLogout}>
              יציאה
            </button>
          </>
        )}
      </div>

      <button className="menu-toggle" type="button" onClick={onOpenMenu} aria-label="תפריט">
        <span />
        <span />
        <span />
      </button>
    </header>
  );
}
