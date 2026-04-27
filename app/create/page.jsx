'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { openAuthModal } from '@/lib/auth-modal';
import SecretComposer from '@/components/SecretComposer';

export default function CreatePage() {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const lastPayloadRef = useRef(null);

  async function publish(payload) {
    lastPayloadRef.current = payload;
    setMessage('');
    setSubmitting(true);

    try {
      const data = await api('/api/secrets', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      window.location.href = data.secret.url;
    } catch (error) {
      if (error.status === 401) {
        openAuthModal({
          mode: 'onboarding',
          onSuccess: () => {
            if (lastPayloadRef.current) publish(lastPayloadRef.current);
          }
        });
        return;
      }
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="main">
      <section className="feed-header">
        <p className="eyebrow">כתיבת סוד</p>
        <h1>זה המקום להוציא הכל</h1>
        <p>אפשר להתחיל לכתוב ולעצב עכשיו. אורחים יוכלו לפרסם רק אחרי התחברות קצרה.</p>
      </section>

      <section className="auth-panel compose-page">
        <SecretComposer onSubmit={publish} submitting={submitting} error={message} />
      </section>
    </main>
  );
}
