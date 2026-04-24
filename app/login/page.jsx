'use client';

import { useState } from 'react';
import { api, setToken } from '@/lib/api';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(form) });
      setToken(data.token);
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="main">
      <section className="hero"><h1>כניסה</h1><p>חזרה למקום שבו אפשר להגיד הכל.</p></section>
      <form className="form auth-panel" onSubmit={submit}>
        <input className="input" type="email" placeholder="אימייל" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="password" placeholder="סיסמה" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="error">{error}</p>}
        <button className="btn primary">כניסה</button>
        <a className="muted" href="/register">אין לך חשבון? הרשמה</a>
      </form>
    </main>
  );
}
