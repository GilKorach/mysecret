'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { openAuthModal } from '@/lib/auth-modal';

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

export default function SecretCard({ secret, onChanged }) {
  const [liked, setLiked] = useState(Boolean(secret.userReaction));
  const [likeCount, setLikeCount] = useState(secret.reactionsCount || 0);
  const [commentsCount, setCommentsCount] = useState(secret.commentsCount || 0);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [likeSubmitting, setLikeSubmitting] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  useEffect(() => {
    setLiked(Boolean(secret.userReaction));
    setLikeCount(secret.reactionsCount || 0);
    setCommentsCount(secret.commentsCount || 0);
  }, [secret.userReaction, secret.reactionsCount, secret.commentsCount]);

  async function toggleLike() {
    if (likeSubmitting) return;

    const prevLiked = liked;
    const prevCount = likeCount;
    const nextLiked = !prevLiked;

    setLikeSubmitting(true);
    setLiked(nextLiked);
    setLikeCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));

    try {
      if (nextLiked) {
        await api(`/api/secrets/${secret.id}/reaction`, {
          method: 'PUT',
          body: JSON.stringify({ reaction: 'love' })
        });
      } else {
        await api(`/api/secrets/${secret.id}/reaction`, { method: 'DELETE' });
      }
      onChanged?.();
    } catch (error) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      if (error.status === 401) {
        openAuthModal({ mode: 'onboarding' });
        return;
      }
      window.alert(error.message);
    } finally {
      setLikeSubmitting(false);
    }
  }

  async function submitQuickComment(event) {
    event.preventDefault();
    if (commentSubmitting) return;

    const content = commentText.trim();
    if (!content) return;

    setCommentSubmitting(true);
    setCommentsCount((count) => count + 1);
    setCommentText('');

    try {
      await api(`/api/comments/secret/${secret.id}`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
      onChanged?.();
      setCommentOpen(false);
    } catch (error) {
      setCommentsCount((count) => Math.max(0, count - 1));
      setCommentText(content);
      if (error.status === 401) {
        openAuthModal({ mode: 'onboarding' });
        return;
      }
      window.alert(error.message);
    } finally {
      setCommentSubmitting(false);
    }
  }

  return (
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
          <span>{likeCount} לייקים</span>
          <span>{commentsCount} תגובות</span>
        </div>

        <div className="secret-actions">
          <button
            className={`action-btn ${liked ? 'active' : ''}`}
            type="button"
            onClick={toggleLike}
            disabled={likeSubmitting}
            aria-pressed={liked}
          >
            <span className="action-icon">❤️</span>
            <span>{likeCount}</span>
          </button>

          <button
            className={`action-btn ${commentOpen ? 'active' : ''}`}
            type="button"
            onClick={() => setCommentOpen((open) => !open)}
            aria-expanded={commentOpen}
          >
            <span className="action-icon">💬</span>
            <span>{commentsCount}</span>
          </button>
        </div>

        {commentOpen && (
          <form className="quick-comment-form" onSubmit={submitQuickComment}>
            <textarea
              className="quick-comment-input"
              placeholder="כתוב תגובה קצרה..."
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              maxLength={500}
              rows={2}
            />
            <div className="quick-comment-actions">
              <Link href={secret.url} className="btn compact ghost">דיון מלא</Link>
              <button className="btn compact primary" type="submit" disabled={commentSubmitting || !commentText.trim()}>
                {commentSubmitting ? 'שולח...' : 'שלח תגובה'}
              </button>
            </div>
          </form>
        )}
      </div>
    </article>
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
