'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import SecretCard from '@/components/SecretCard';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState([]);
  const [secrets, setSecrets] = useState([]);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const data = await api(`/api/search?q=${encodeURIComponent(q)}`);
      setUsers(data.users);
      setSecrets(data.secrets);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="main">
      <section className="hero"><h1>חיפוש</h1><p>מצאו משתמשים לפי כינוי או סודות לפי טקסט חלקי.</p></section>
      <form className="form auth-panel" onSubmit={submit}>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="מה לחפש?" />
        <button className="btn primary">חיפוש</button>
      </form>
      {error && <p className="error">{error}</p>}
      <section className="grid" style={{ marginTop: '1rem' }}>
        {users.map((user) => (
          <a className="search-row" href={`/profile/${user.id}`} key={user.id}>
            <strong>{user.nickname}</strong>
            <div className="muted">גיל {user.age} · {user.followersCount} עוקבים</div>
          </a>
        ))}
        {secrets.map((secret) => <SecretCard key={secret.id} secret={secret} />)}
      </section>
    </main>
  );
}
