'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const labels = {
  secret_reaction: 'הגיבו רגשית לסוד שלך',
  secret_comment: 'הגיבו לסוד שלך',
  comment_reply: 'השיבו לתגובה שלך',
  follow: 'התחילו לעקוב אחריך'
};

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await api('/api/notifications');
      setItems(data.notifications);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function readAll() {
    await api('/api/notifications/read-all', { method: 'POST' });
    await load();
  }

  return (
    <main className="main">
      <section className="hero">
        <h1>התראות</h1>
        <button className="btn" onClick={readAll}>סימון הכל כנקרא</button>
      </section>
      {error && <p className="error">{error}</p>}
      <section className="grid">
        {items.map((item) => (
          <a className="notice" key={item.id} href={notificationHref(item)}>
            <strong>{item.actor_nickname || 'משתמש'}</strong> {labels[item.type]}
            {!item.is_read && <div className="success">חדש</div>}
          </a>
        ))}
      </section>
    </main>
  );
}

function notificationHref(item) {
  if (item.secret_id) return `/secret/${item.secret_id}/${item.secret_slug || 'secret'}`;
  if (item.actor_id) return `/profile/${item.actor_id}`;
  return '/';
}
