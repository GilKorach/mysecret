'use client';

import { useState } from 'react';

const themes = [
  { id: 'violet', label: 'סגול', backgroundPreset: 'linear-gradient(135deg, #271454, #6848ff)' },
  { id: 'blue', label: 'כחול', backgroundPreset: 'linear-gradient(135deg, #13295f, #42b8ff)' },
  { id: 'night', label: 'לילה', backgroundPreset: 'linear-gradient(135deg, #161931, #2a2d5a)' },
  { id: 'sunset', label: 'שקיעה', backgroundPreset: 'linear-gradient(135deg, #5b1b44, #ff7c7c)' }
];

const emojiOptions = ['', '✨', '🌙', '🫶', '💭', '🔥'];

function hexToRgb(value) {
  const match = /^#([0-9a-fA-F]{6})$/.exec(value);
  if (!match) return null;
  return {
    r: Number.parseInt(match[1].slice(0, 2), 16),
    g: Number.parseInt(match[1].slice(2, 4), 16),
    b: Number.parseInt(match[1].slice(4, 6), 16)
  };
}

function luminance({ r, g, b }) {
  const toLinear = (channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const red = toLinear(r);
  const green = toLinear(g);
  const blue = toLinear(b);
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
}

function contrastRatio(colorA, colorB) {
  const light = Math.max(colorA, colorB);
  const dark = Math.min(colorA, colorB);
  return (light + 0.05) / (dark + 0.05);
}

function ensureReadableTextColor(backgroundColor, textColor) {
  const bg = hexToRgb(backgroundColor);
  const text = hexToRgb(textColor);
  if (!bg || !text) return textColor;

  const bgLum = luminance(bg);
  const textLum = luminance(text);
  if (contrastRatio(bgLum, textLum) >= 3) return textColor;

  const dark = hexToRgb('#111827');
  const light = hexToRgb('#ffffff');
  const darkRatio = contrastRatio(bgLum, luminance(dark));
  const lightRatio = contrastRatio(bgLum, luminance(light));
  return darkRatio > lightRatio ? '#111827' : '#ffffff';
}

export default function SecretComposer({
  onSubmit,
  submitting = false,
  error = '',
  submitLabel = 'פרסם סוד',
  submitLoadingLabel = 'מפרסם...'
}) {
  const [form, setForm] = useState({
    content: '',
    backgroundPreset: themes[0].backgroundPreset,
    backgroundColor: '#37226e',
    textColor: '#ffffff',
    textAlign: 'right',
    emoji: ''
  });

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectTheme(theme) {
    setForm((current) => ({ ...current, backgroundPreset: theme.backgroundPreset }));
  }

  function selectBackgroundColor(value) {
    setForm((current) => ({
      ...current,
      backgroundPreset: null,
      backgroundColor: value,
      textColor: ensureReadableTextColor(value, current.textColor)
    }));
  }

  async function submit(event) {
    event.preventDefault();
    const payload = {
      content: form.emoji ? `${form.emoji} ${form.content}` : form.content,
      backgroundPreset: form.backgroundPreset,
      backgroundColor: form.backgroundColor,
      textColor: ensureReadableTextColor(form.backgroundColor, form.textColor),
      textAlign: form.textAlign
    };
    await onSubmit?.(payload);
  }

  const previewBackground = form.backgroundPreset || form.backgroundColor;
  const previewText = form.emoji ? `${form.emoji} ${form.content || 'מה הסוד שלך?'}` : (form.content || 'מה הסוד שלך?');

  return (
    <form className="form composer-form" onSubmit={submit}>
      <textarea
        className="textarea compose-textarea"
        placeholder="מה הסוד שלך?"
        required
        minLength={5}
        maxLength={4000}
        value={form.content}
        onChange={(event) => update('content', event.target.value)}
      />

      <section className="composer-panel">
        <div className="field">
          <label>ערכת נושא</label>
          <div className="toolbar">
            {themes.map((theme) => (
              <button key={theme.id} type="button" className="chip" onClick={() => selectTheme(theme)}>
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>אייקון</label>
          <div className="toolbar">
            {emojiOptions.map((emoji) => (
              <button key={emoji || 'none'} type="button" className={`chip ${form.emoji === emoji ? 'primary' : ''}`} onClick={() => update('emoji', emoji)}>
                {emoji || 'ללא'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid two-col">
          <div className="field">
            <label>צבע רקע</label>
            <input type="color" aria-label="צבע רקע" value={form.backgroundColor} onChange={(event) => selectBackgroundColor(event.target.value)} />
          </div>
          <div className="field">
            <label>צבע טקסט</label>
            <input type="color" aria-label="צבע טקסט" value={form.textColor} onChange={(event) => update('textColor', event.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>יישור טקסט</label>
          <select className="select" value={form.textAlign} onChange={(event) => update('textAlign', event.target.value)}>
            <option value="right">ימין</option>
            <option value="center">מרכז</option>
            <option value="left">שמאל</option>
          </select>
        </div>
      </section>

      <article className="secret-preview-card">
        <div
          className="secret-preview-body"
          style={{
            background: previewBackground,
            color: ensureReadableTextColor(form.backgroundColor, form.textColor),
            textAlign: form.textAlign
          }}
        >
          {previewText}
        </div>
      </article>

      {error && <p className="error">{error}</p>}
      <button className="btn primary" disabled={submitting}>
        {submitting ? submitLoadingLabel : submitLabel}
      </button>
    </form>
  );
}
