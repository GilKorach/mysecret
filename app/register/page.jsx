'use client';

import { useState } from 'react';
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

export default function RegisterPage() {
  const [form, setForm] = useState({ nickname: '', email: '', password: '', gender: 'other', birthDate: '' });
  const [error, setError] = useState('');

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');

    const isoBirthDate = toIsoBirthDate(form.birthDate);
    if (!isoBirthDate) {
      setError('תאריך לידה לא תקין. יש להזין בפורמט DD/MM/YYYY');
      return;
    }

    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...form, birthDate: isoBirthDate })
      });
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="main">
      <section className="hero"><h1>הרשמה</h1><p>זהות ציבורית מינימלית. האימייל ותאריך הלידה המלא לא יוצגו.</p></section>
      <form className="form auth-panel" onSubmit={submit}>
        <input className="input" placeholder="כינוי ייחודי" required value={form.nickname} onChange={(e) => update('nickname', e.target.value)} />
        <input className="input" type="email" placeholder="אימייל" required value={form.email} onChange={(e) => update('email', e.target.value)} />
        <input className="input" type="password" placeholder="סיסמה" minLength="8" required value={form.password} onChange={(e) => update('password', e.target.value)} />
        <select className="select" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
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
          value={form.birthDate}
          onChange={(e) => update('birthDate', e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <button className="btn primary">יצירת חשבון</button>
      </form>
    </main>
  );
}
