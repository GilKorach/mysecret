'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { openAuthModal } from '@/lib/auth-modal';
import SecretComposer from '@/components/SecretComposer';

export default function CreateSecretModal({ open, onClose }) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const lastPayloadRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    function onKeydown(event) {
      if (event.key === 'Escape') onClose?.();
    }

    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [open, onClose]);

  if (!open) return null;

  async function publish(payload) {
    lastPayloadRef.current = payload;
    setSubmitting(true);
    setError('');

    try {
      const data = await api('/api/secrets', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      onClose?.();
      window.location.href = data.secret.url;
    } catch (nextError) {
      if (nextError.status === 401) {
        openAuthModal({
          mode: 'onboarding',
          onSuccess: () => {
            if (lastPayloadRef.current) publish(lastPayloadRef.current);
          }
        });
        return;
      }

      setError(nextError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="compose-layer" role="dialog" aria-modal="true" aria-label="כתיבת סוד">
      <button className="compose-backdrop" type="button" aria-label="סגירה" onClick={onClose} />
      <section className="compose-card">
        <header className="compose-head">
          <h2>כתוב סוד חדש</h2>
          <button className="auth-close" type="button" onClick={onClose} aria-label="סגירה">×</button>
        </header>

        <SecretComposer onSubmit={publish} submitting={submitting} error={error} />
      </section>
    </div>
  );
}
