'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { textSizeClass } from '@/components/SecretCard';

const presets = [
  { name: 'לילה', value: 'linear-gradient(135deg, #151923, #08090d)' },
  { name: 'לב', value: 'linear-gradient(135deg, #3b1020, #e85d75)' },
  { name: 'ים', value: 'linear-gradient(135deg, #0f2f3d, #42d9b7)' },
  { name: 'זהב', value: 'linear-gradient(135deg, #2a2113, #f2b84b)' }
];

export default function CreatePage() {
  const [form, setForm] = useState({
    content: '',
    backgroundPreset: presets[0].value,
    backgroundColor: '#111827',
    textColor: '#ffffff',
    textAlign: 'right'
  });
  const [message, setMessage] = useState('');

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectPreset(value) {
    setForm((current) => ({ ...current, backgroundPreset: value }));
  }

  function selectColor(value) {
    setForm((current) => ({
      ...current,
      backgroundPreset: null,
      backgroundColor: value
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    try {
      const data = await api('/api/secrets', { method: 'POST', body: JSON.stringify(form) });
      window.location.href = data.secret.url;
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="main">
      <section className="hero">
        <h1>סוד חדש</h1>
        <p>טקסט בלבד, בעברית, בלי תמונות ובלי סרטונים. אפשר לפרסם סוד אחד בכל 24 שעות.</p>
      </section>
      <div className="grid two-col">
        <form className="form auth-panel" onSubmit={submit}>
          <div className="field">
            <label htmlFor="content">מה הסוד?</label>
            <textarea id="content" className="textarea" required maxLength="4000" value={form.content} onChange={(e) => update('content', e.target.value)} />
          </div>
          <div className="field">
            <label>רקע</label>
            <div className="toolbar">
              {presets.map((preset) => (
                <button type="button" className="chip" key={preset.name} onClick={() => selectPreset(preset.value)}>
                  {preset.name}
                </button>
              ))}
              <input aria-label="צבע רקע" type="color" value={form.backgroundColor} onChange={(e) => selectColor(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>צבע טקסט</label>
            <input aria-label="צבע טקסט" type="color" value={form.textColor} onChange={(e) => update('textColor', e.target.value)} />
          </div>
          <div className="field">
            <label>יישור</label>
            <select className="select" value={form.textAlign} onChange={(e) => update('textAlign', e.target.value)}>
              <option value="right">ימין</option>
              <option value="center">מרכז</option>
              <option value="left">שמאל</option>
            </select>
          </div>
          <p className="policy">אסור לפרסם אלימות, שנאה, חשיפת פרטים אישיים, ספאם, תוכן מיני מפורש, איומים או הטרדה.</p>
          {message && <p className="error">{message}</p>}
          <button className="btn primary">פרסום סוד</button>
        </form>
        <article className="secret-card">
          <div
            className={`secret-body ${textSizeClass(form.content || 'תצוגה מקדימה')}`}
            style={{ background: form.backgroundPreset || form.backgroundColor, color: form.textColor, textAlign: form.textAlign }}
          >
            <p>{form.content || 'תצוגה מקדימה'}</p>
          </div>
          <div className="secret-meta muted">כך הסוד יראה בפיד</div>
        </article>
      </div>
    </main>
  );
}
