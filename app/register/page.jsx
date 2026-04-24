'use client';

import { useState } from 'react';
import { api, setToken } from '@/lib/api';

export default function RegisterPage() {
  const [form, setForm] = useState({ nickname: '', email: '', password: '', gender: 'other', birthDate: '' });
  const [error, setError] = useState('');

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const data = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(form) });
      setToken(data.token);
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
        <input className="input" type="date" required value={form.birthDate} onChange={(e) => update('birthDate', e.target.value)} />
        {error && <p className="error">{error}</p>}
        <button className="btn primary">יצירת חשבון</button>
      </form>
    </main>
  );
}
