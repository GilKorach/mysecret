'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { openAuthModal } from '@/lib/auth-modal';

const reactionOptions = [
  { uiKey: 'love', apiReaction: 'love', emoji: '💖', label: 'אהבתי' },
  { uiKey: 'funny', apiReaction: 'funny', emoji: '😂', label: 'מצחיק' },
  { uiKey: 'wow', apiReaction: 'shock', emoji: '🤯', label: 'וואו' },
  { uiKey: 'sad', apiReaction: 'sad', emoji: '😢', label: 'עצוב' },
  { uiKey: 'angry', apiReaction: 'angry', emoji: '😡', label: 'כועס' },
  { uiKey: 'interesting', apiReaction: 'shock', emoji: '🤔', label: 'מעניין' },
  { uiKey: 'curious', apiReaction: 'funny', emoji: '👀', label: 'מסקרן' },
  { uiKey: 'hug', apiReaction: 'love', emoji: '🫂', label: 'מחבק' }
];

function createBreakdown(total, selectedUiKey) {
  const counts = {};
  reactionOptions.forEach((option) => {
    counts[option.uiKey] = 0;
  });
  if (total > 0 && selectedUiKey) {
    counts[selectedUiKey] = total;
  }
  return counts;
}

function relativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60]
  ];
  const rtf = new Intl.RelativeTimeFormat('he', { numeric: 'auto' });

  for (const [unit, value] of units) {
    if (Math.abs(seconds) >= value || unit === 'minute') {
      return rtf.format(Math.round(seconds / value), unit);
    }
  }

  return rtf.format(seconds, 'second');
}

function uiFromApiReaction(reaction) {
  if (!reaction) return null;
  return reactionOptions.find((option) => option.apiReaction === reaction)?.uiKey || null;
}

export default function SecretCard({ secret, onChanged }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [userReaction, setUserReaction] = useState(secret.userReaction || null);
  const [selectedUiKey, setSelectedUiKey] = useState(uiFromApiReaction(secret.userReaction));
  const [reactionsCount, setReactionsCount] = useState(secret.reactionsCount || 0);
  const [commentsCount, setCommentsCount] = useState(secret.commentsCount || 0);
  const [reactionBreakdown, setReactionBreakdown] = useState(createBreakdown(secret.reactionsCount || 0, uiFromApiReaction(secret.userReaction)));

  useEffect(() => {
    const nextSelected = uiFromApiReaction(secret.userReaction);
    setUserReaction(secret.userReaction || null);
    setSelectedUiKey(nextSelected);
    setReactionsCount(secret.reactionsCount || 0);
    setCommentsCount(secret.commentsCount || 0);
    setReactionBreakdown(createBreakdown(secret.reactionsCount || 0, nextSelected));
  }, [secret.userReaction, secret.reactionsCount, secret.commentsCount]);

  useEffect(() => {
    if (!pickerOpen) return;

    function onKeydown(event) {
      if (event.key === 'Escape') setPickerOpen(false);
    }

    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [pickerOpen]);

  const selectedOption = useMemo(
    () => reactionOptions.find((option) => option.uiKey === selectedUiKey) || reactionOptions[0],
    [selectedUiKey]
  );

  async function selectReaction(option) {
    try {
      if (userReaction === option.apiReaction) {
        await api(`/api/secrets/${secret.id}/reaction`, { method: 'DELETE' });
        const prevSelected = selectedUiKey;
        setUserReaction(null);
        setSelectedUiKey(null);
        setReactionsCount((count) => Math.max(0, count - 1));
        setReactionBreakdown((current) => ({
          ...current,
          [prevSelected]: Math.max(0, (current[prevSelected] || 0) - 1)
        }));
      } else {
        await api(`/api/secrets/${secret.id}/reaction`, { method: 'PUT', body: JSON.stringify({ reaction: option.apiReaction }) });
        const prevSelected = selectedUiKey;
        const hadReaction = Boolean(secret.userReaction || userReaction);
        setSelectedUiKey(option.uiKey);
        setUserReaction(option.apiReaction);

        if (!hadReaction) {
          setReactionsCount((count) => count + 1);
        }
        setReactionBreakdown((current) => {
          const next = { ...current };
          if (hadReaction && prevSelected && prevSelected !== option.uiKey) {
            next[prevSelected] = Math.max(0, (next[prevSelected] || 0) - 1);
          }
          if (!hadReaction || prevSelected !== option.uiKey) {
            next[option.uiKey] = (next[option.uiKey] || 0) + 1;
          }
          return next;
        });
      }

      setPickerOpen(false);
      onChanged?.();
    } catch (error) {
      if (error.status === 401) {
        setPickerOpen(false);
        openAuthModal({ mode: 'onboarding' });
        return;
      }
      window.alert(error.message);
    }
  }

  return (
    <>
      <article className="secret-card">
        <div className="secret-content">
          <div className="secret-head">
            <Link href={`/profile/${secret.userId}`} className="secret-author">
              <span>{secret.nickname}</span>
            </Link>
            <time className="muted" dateTime={secret.createdAt}>{relativeTime(secret.createdAt)}</time>
          </div>

          <Link
            href={secret.url}
            className="secret-preview"
            style={{
              background: secret.backgroundPreset || secret.backgroundColor,
              color: secret.textColor,
              textAlign: secret.textAlign
            }}
          >
            {secret.content}
          </Link>
        </div>

        <div className="secret-meta">
          <div className="toolbar muted">
            <span>{reactionsCount} תגובות</span>
            <span>{commentsCount} תגובות דיון</span>
          </div>

          <div className="secret-actions">
            <Link href={secret.url} className="action-btn">
              <span className="action-icon">💬</span>
              <span>{commentsCount}</span>
            </Link>
            <button className={`action-btn reaction-main ${userReaction ? 'active' : ''}`} type="button" onClick={() => setPickerOpen(true)}>
              <span className="action-icon">{selectedOption.emoji}</span>
              <span>{reactionsCount}</span>
            </button>
          </div>
        </div>
      </article>

      {pickerOpen && (
        <div className="reaction-sheet-layer" role="dialog" aria-modal="true" aria-label="בחירת תגובה">
          <button className="reaction-sheet-backdrop" type="button" aria-label="סגירה" onClick={() => setPickerOpen(false)} />
          <section className="reaction-sheet">
            <div className="reaction-sheet-handle" />
            <div className="reaction-sheet-summary">
              <div className="secret-head">
                <span className="secret-author">{secret.nickname}</span>
                <time className="muted" dateTime={secret.createdAt}>{relativeTime(secret.createdAt)}</time>
              </div>
              <p>{secret.content}</p>
              <div className="toolbar muted">
                <span>{reactionsCount} לייקים</span>
                <span>{commentsCount} תגובות</span>
              </div>
            </div>
            <header className="reaction-sheet-head">
              <h3>איך הרגשת עם זה?</h3>
            </header>

            <div className="reaction-grid">
              {reactionOptions.map((option) => (
                <button
                  key={option.uiKey}
                  type="button"
                  className={`reaction-tile ${selectedUiKey === option.uiKey ? 'selected' : ''}`}
                  onClick={() => selectReaction(option)}
                >
                  <span>{option.emoji}</span>
                  <small>{option.label}</small>
                  <strong>{reactionBreakdown[option.uiKey] || 0}</strong>
                </button>
              ))}
            </div>

            <button className="btn" type="button" onClick={() => setPickerOpen(false)}>ביטול</button>
          </section>
        </div>
      )}
    </>
  );
}

export function ReportButton({ targetType, targetId, onDone }) {
  async function report() {
    const reason = window.prompt('סיבת דיווח: violence, hate_speech, personal_data, spam, explicit_sexual_content, threats, harassment, other', 'harassment');
    if (!reason) return;

    try {
      await api('/api/reports', { method: 'POST', body: JSON.stringify({ targetType, targetId, reason }) });
      onDone?.();
      window.alert('הדיווח נשלח לבדיקה');
    } catch (error) {
      if (error.status === 401) {
        openAuthModal({ mode: 'onboarding' });
        return;
      }
      window.alert(error.message);
    }
  }

  return <button className="chip" onClick={report}>דיווח</button>;
}
