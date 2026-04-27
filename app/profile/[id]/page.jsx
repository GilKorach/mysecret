'use client';

import { use, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { openAuthModal } from '@/lib/auth-modal';
import AnonymousAvatar from '@/components/AnonymousAvatar';
import SecretCard, { ReportButton } from '@/components/SecretCard';

const genderLabels = { female: 'אישה', male: 'גבר', other: 'אחר' };

function safeExternalLink(raw) {
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return raw;
  } catch (_error) {
    return null;
  }
  return null;
}

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
      } catch (nextError) {
        setError(nextError.message);
      }
    }

    loadProfile();
  }, [routeParams.id]);

  async function load() {
    try {
      const data = await api(`/api/users/${routeParams.id}`);
      setProfile(data.user);
      setSecrets(data.secrets);
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function follow() {
    try {
      await api(`/api/users/${routeParams.id}/follow`, { method: 'POST' });
      await load();
    } catch (nextError) {
      if (nextError.status === 401) {
        openAuthModal({ mode: 'onboarding', onSuccess: () => follow() });
        return;
      }
      setError(nextError.message);
    }
  }

  async function block() {
    try {
      await api(`/api/users/${routeParams.id}/block`, { method: 'POST' });
      window.location.href = '/';
    } catch (nextError) {
      if (nextError.status === 401) {
        openAuthModal({ mode: 'onboarding', onSuccess: () => block() });
        return;
      }
      setError(nextError.message);
    }
  }

  if (error) return <main className="main"><div className="notice error">{error}</div></main>;
  if (!profile) return <main className="main"><div className="notice">טוען פרופיל...</div></main>;
  const externalLink = safeExternalLink(profile.externalLink);

  return (
    <main className="main">
      <section className="profile-header">
        <div className="profile-identity">
          <AnonymousAvatar nickname={profile.nickname} size="lg" />
          <div>
            <h1>{profile.nickname}</h1>
            <p className="muted">{genderLabels[profile.gender]} · גיל {profile.age} · {profile.followersCount} עוקבים</p>
          </div>
        </div>

        {profile.bio && <p>{profile.bio}</p>}
        {externalLink && <a className="muted" href={externalLink} rel="noreferrer" target="_blank">{externalLink}</a>}

        <div className="actions profile-actions">
          <button className="btn primary" onClick={follow}>מעקב</button>
          <button className="btn" onClick={block}>חסימה</button>
          <ReportButton targetType="user" targetId={profile.id} />
        </div>
      </section>

      <section className="feed profile-feed">
        {secrets.map((secret) => <SecretCard key={secret.id} secret={secret} onChanged={load} />)}
      </section>
    </main>
  );
}
