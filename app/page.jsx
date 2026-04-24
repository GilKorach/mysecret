'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import SecretCard from '@/components/SecretCard';

export default function HomePage() {
  const [secrets, setSecrets] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const offsetRef = useRef(0);
  const loadingRef = useRef(false);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  async function load(reset = false) {
    setLoading(true);
    setError('');
    loadingRef.current = true;

    try {
      const currentOffset = reset ? 0 : offsetRef.current;
      const data = await api(`/api/secrets/feed?offset=${currentOffset}&limit=12`);
      setSecrets((items) => (reset ? data.secrets : [...items, ...data.secrets]));
      setOffset(data.nextOffset);
      offsetRef.current = data.nextOffset;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }

  useEffect(() => {
    load(true);
  }, []);

  useEffect(() => {
    function onScroll() {
      if (loadingRef.current) return;
      if (window.innerHeight + window.scrollY > document.body.offsetHeight - 500) load();
    }

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <main className="main">
      <section className="hero">
        <h1>MySecret</h1>
        <p>רשת חברתית אנונימית לשיתוף סודות. מקום שבו אפשר להגיד הכל.</p>
        <div className="actions">
          <Link className="btn primary" href="/create">לכתוב סוד</Link>
          <Link className="btn" href="/register">להצטרף</Link>
        </div>
      </section>
      {error && <p className="error">{error}</p>}
      <section className="feed" aria-label="פיד סודות">
        {secrets.map((secret) => <SecretCard key={secret.id} secret={secret} onChanged={() => load(true)} />)}
        {loading && <div className="notice">טוען סודות...</div>}
      </section>
    </main>
  );
}
