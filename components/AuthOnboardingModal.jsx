'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

function toIsoBirthDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isValid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isValid) return null;
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

const initialLogin = { email: '', password: '' };
const initialSignup = {
  nickname: '',
  email: '',
  password: '',
  gender: 'other',
  birthDate: ''
};

export default function AuthOnboardingModal({
  open,
  mode = 'onboarding',
  onClose,
  onSuccess
}) {
  const [activeMode, setActiveMode] = useState(mode);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [signupForm, setSignupForm] = useState(initialSignup);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setActiveMode(mode);
    setError('');
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;

    function onKeydown(event) {
      if (event.key === 'Escape') onClose?.();
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeydown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeydown);
    };
  }, [open, onClose]);

  if (!open) return null;

  async function submitLogin(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(loginForm) });
      onSuccess?.(data.user);
      onClose?.();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitSignup(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const isoBirthDate = toIsoBirthDate(signupForm.birthDate);
    if (!isoBirthDate) {
      setError('תאריך לידה לא תקין. יש להזין בפורמט DD/MM/YYYY');
      setSubmitting(false);
      return;
    }

    try {
      const data = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...signupForm, birthDate: isoBirthDate })
      });
      onSuccess?.(data.user);
      onClose?.();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-modal-layer" role="dialog" aria-modal="true" aria-label="התחברות או הרשמה">
      <button className="auth-modal-backdrop" type="button" onClick={() => onClose?.()} aria-label="סגירה" />
      <section className="auth-modal-card">
        <header className="auth-modal-header">
          <h2>{activeMode === 'login' ? 'התחברות לחשבון' : activeMode === 'signup' ? 'יצירת חשבון' : 'רוצה לשתף את הסוד שלך?'}</h2>
          <button className="auth-close" type="button" onClick={() => onClose?.()} aria-label="סגירה">×</button>
        </header>

        {activeMode === 'onboarding' && (
          <div className="onboarding-content">
            <p>עוד רגע אתה בפנים. זה לוקח 10 שניות.</p>
            <div className="auth-switch">
              <button type="button" className="btn primary" onClick={() => setActiveMode('login')}>התחברות</button>
              <button type="button" className="btn" onClick={() => setActiveMode('signup')}>הרשמה</button>
            </div>
          </div>
        )}

        {activeMode === 'login' && (
          <form className="form" onSubmit={submitLogin}>
            <input
              className="input"
              type="email"
              placeholder="אימייל"
              required
              value={loginForm.email}
              onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
            />
            <input
              className="input"
              type="password"
              placeholder="סיסמה"
              required
              value={loginForm.password}
              onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
            />
            {error && <p className="error">{error}</p>}
            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? 'מתחבר...' : 'התחברות'}
            </button>
          </form>
        )}

        {activeMode === 'signup' && (
          <form className="form" onSubmit={submitSignup}>
            <input
              className="input"
              placeholder="כינוי ייחודי"
              required
              value={signupForm.nickname}
              onChange={(event) => setSignupForm((current) => ({ ...current, nickname: event.target.value }))}
            />
            <input
              className="input"
              type="email"
              placeholder="אימייל"
              required
              value={signupForm.email}
              onChange={(event) => setSignupForm((current) => ({ ...current, email: event.target.value }))}
            />
            <input
              className="input"
              type="password"
              placeholder="סיסמה (8 תווים לפחות)"
              minLength="8"
              required
              value={signupForm.password}
              onChange={(event) => setSignupForm((current) => ({ ...current, password: event.target.value }))}
            />
            <select
              className="select"
              value={signupForm.gender}
              onChange={(event) => setSignupForm((current) => ({ ...current, gender: event.target.value }))}
            >
              <option value="female">אישה</option>
              <option value="male">גבר</option>
              <option value="other">אחר</option>
            </select>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              placeholder="DD/MM/YYYY"
              pattern="\\d{2}/\\d{2}/\\d{4}"
              title="פורמט נדרש: DD/MM/YYYY"
              required
              value={signupForm.birthDate}
              onChange={(event) => setSignupForm((current) => ({ ...current, birthDate: event.target.value }))}
            />
            {error && <p className="error">{error}</p>}
            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? 'יוצר חשבון...' : 'הרשמה'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
