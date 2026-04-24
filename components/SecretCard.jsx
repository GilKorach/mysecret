'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

const labels = {
  love: 'לב',
  sad: 'עצוב',
  funny: 'מצחיק',
  shock: 'שוק',
  angry: 'כועס'
};

const marks = {
  love: '♥',
  sad: '☹',
  funny: '☺',
  shock: '!',
  angry: '×'
};

export function textSizeClass(content) {
  const length = content.length;
  if (length < 90) return 'short';
  if (length < 260) return 'medium';
  if (length < 700) return 'long';
  return 'very-long';
}

export default function SecretCard({ secret, onChanged }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function react(reaction) {
    if (secret.userReaction === reaction) {
      await api(`/api/secrets/${secret.id}/reaction`, { method: 'DELETE' });
    } else {
      await api(`/api/secrets/${secret.id}/reaction`, { method: 'PUT', body: JSON.stringify({ reaction }) });
    }

    onChanged?.();
  }

  return (
    <article className="secret-card">
      <div className="secret-card-menu" ref={menuRef}>
        <button
          className="secret-menu-trigger"
          type="button"
          aria-label="אפשרויות נוספות"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          ...
        </button>
        {menuOpen && (
          <div className="secret-menu-dropdown">
            <ReportButton targetType="secret" targetId={secret.id} onDone={() => setMenuOpen(false)} />
          </div>
        )}
      </div>
      <Link
        href={secret.url}
        className={`secret-body ${textSizeClass(secret.content)}`}
        style={{
          background: secret.backgroundPreset || secret.backgroundColor,
          color: secret.textColor,
          textAlign: secret.textAlign
        }}
      >
        <p>{secret.content}</p>
      </Link>
      <div className="secret-meta">
        <div className="muted">פורסם על ידי <Link href={`/profile/${secret.userId}`}>{secret.nickname}</Link></div>
        <div className="reaction-row" aria-label="תגובות">
          {Object.entries(labels).map(([key, label]) => (
            <button className={`chip ${secret.userReaction === key ? 'primary' : ''}`} key={key} onClick={() => react(key)} title={label}>
              {marks[key]} {label}
            </button>
          ))}
        </div>
        <div className="toolbar muted">
          <span>{secret.reactionsCount} תגובות רגש</span>
          <span>{secret.commentsCount} תגובות</span>
          {secret.content.length >= 700 && <Link href={secret.url}>הצג עוד</Link>}
        </div>
      </div>
    </article>
  );
}

export function ReportButton({ targetType, targetId, onDone }) {
  async function report() {
    const reason = window.prompt('סיבת דיווח: violence, hate_speech, personal_data, spam, explicit_sexual_content, threats, harassment, other', 'harassment');
    if (!reason) return;
    await api('/api/reports', { method: 'POST', body: JSON.stringify({ targetType, targetId, reason }) });
    onDone?.();
    window.alert('הדיווח נשלח לבדיקה');
  }

  return <button className="secret-menu-item" onClick={report}>דיווח</button>;
}
