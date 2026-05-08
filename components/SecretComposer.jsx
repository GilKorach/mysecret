'use client';

import { useRef, useState } from 'react';

const alignmentOptions = [
  { value: 'right', label: 'ימין' },
  { value: 'center', label: 'מרכז' },
  { value: 'left', label: 'שמאל' }
];

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
  return (0.2126 * toLinear(r)) + (0.7152 * toLinear(g)) + (0.0722 * toLinear(b));
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
  const customColorInputRef = useRef(null);
  const [form, setForm] = useState({
    content: '',
    backgroundColor: '#151A27',
    textColor: '#F4EFE7',
    textAlign: 'right'
  });

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectBackgroundColor(value) {
    setForm((current) => ({
      ...current,
      backgroundColor: value,
      textColor: ensureReadableTextColor(value, current.textColor)
    }));
  }

  function openCustomColorPicker() {
    customColorInputRef.current?.click();
  }

  async function submit(event) {
    event.preventDefault();
    const payload = {
      content: form.content,
      backgroundPreset: null,
      backgroundColor: form.backgroundColor,
      textColor: ensureReadableTextColor(form.backgroundColor, form.textColor),
      textAlign: form.textAlign
    };
    await onSubmit?.(payload);
  }

  const canSubmit = form.content.trim().length >= 5 && !submitting;
  const previewText = form.content || 'מה הסוד שלך?';

  return (
    <form className="form composer-form luxury-composer" onSubmit={submit}>
      <div className="composer-editor">
        <label className="composer-label" htmlFor="secret-content">הסוד שלך</label>
        <textarea
          id="secret-content"
          className="textarea compose-textarea"
          placeholder="מה הסוד שלך?"
          required
          minLength={5}
          maxLength={4000}
          value={form.content}
          onChange={(event) => update('content', event.target.value)}
        />
      </div>

      <section className="composer-panel" aria-labelledby="composer-settings-title">
        <h3 id="composer-settings-title">הגדרות</h3>

        <div className="field">
          <span className="composer-label">רקע הסוד</span>
          <div className="background-grid single" role="group" aria-label="בחירת צבע רקע">
            <button
              type="button"
              className="background-option custom-background-option selected"
              style={{ '--custom-color': form.backgroundColor }}
              onClick={openCustomColorPicker}
              aria-label="בחירת צבע רקע מותאם"
              aria-pressed="true"
            >
              <span className="custom-background-plus" aria-hidden="true">+</span>
            </button>
          </div>
        </div>

        <input
          ref={customColorInputRef}
          className="visually-hidden-color-input"
          id="secret-bg-color"
          type="color"
          aria-label="צבע רקע מותאם"
          value={form.backgroundColor}
          onChange={(event) => selectBackgroundColor(event.target.value)}
        />

        <div className="composer-controls single-control">
          <div className="field">
            <label className="composer-label" htmlFor="secret-text-align">יישור טקסט</label>
            <select
              id="secret-text-align"
              className="select composer-select"
              value={form.textAlign}
              onChange={(event) => update('textAlign', event.target.value)}
            >
              {alignmentOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <article className="secret-preview-card" aria-labelledby="composer-preview-title">
        <h3 id="composer-preview-title">תצוגה מקדימה</h3>
        <div
          className="secret-preview-body"
          style={{
            background: form.backgroundColor,
            color: ensureReadableTextColor(form.backgroundColor, form.textColor),
            textAlign: form.textAlign
          }}
        >
          {previewText}
        </div>
      </article>

      <div className="composer-submit-row">
        {error && <p className="error">{error}</p>}
        <button className="btn primary composer-submit" disabled={!canSubmit}>
          {submitting ? submitLoadingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
