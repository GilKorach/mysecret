'use client';

import { use, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import SecretCard, { ReportButton } from '@/components/SecretCard';

const genderLabels = { female: 'אישה', male: 'גבר', other: 'אחר' };

export default function ProfilePage({ params }) {
  const routeParams = use(params);
  const [profile, setProfile] = useState(null);
  const [secrets, setSecrets] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await api(`/api/users/${routeParams.id}`);
        setProfile(data.user);
        setSecrets(data.secrets);
      } catch (err) {
        setError(err.message);
      }
    }

    loadProfile();
  }, [routeParams.id]);

  async function load() {
    try {
      const data = await api(`/api/users/${routeParams.id}`);
      setProfile(data.user);
      setSecrets(data.secrets);
    } catch (err) {
      setError(err.message);
    }
  }

  async function follow() {
    await api(`/api/users/${routeParams.id}/follow`, { method: 'POST' });
    await load();
  }

  async function block() {
    await api(`/api/users/${routeParams.id}/block`, { method: 'POST' });
    window.location.href = '/';
  }

  if (error) return <main className="main"><div className="notice error">{error}</div></main>;
  if (!profile) return <main className="main"><div className="notice">טוען פרופיל...</div></main>;

  return (
    <main className="main">
      <section className="profile-header">
        <h1>{profile.nickname}</h1>
        <p className="muted">{genderLabels[profile.gender]} · גיל {profile.age} · {profile.followersCount} עוקבים</p>
        {profile.bio && <p>{profile.bio}</p>}
        {profile.externalLink && <a className="muted" href={profile.externalLink} rel="noreferrer" target="_blank">{profile.externalLink}</a>}
        <div className="actions" style={{ marginTop: '.8rem' }}>
          <button className="btn primary" onClick={follow}>מעקב</button>
          <button className="btn" onClick={block}>חסימה</button>
          <ReportButton targetType="user" targetId={profile.id} />
        </div>
      </section>
      <section className="feed" style={{ marginTop: '1rem' }}>
        {secrets.map((secret) => <SecretCard key={secret.id} secret={secret} onChanged={load} />)}
      </section>
    </main>
  );
}
