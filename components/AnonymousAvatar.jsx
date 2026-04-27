'use client';

function hash(value = '') {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = ((result << 5) - result) + value.charCodeAt(index);
    result |= 0;
  }
  return Math.abs(result);
}

function initials(name = '') {
  const parts = String(name).trim().split(/\s+|_|-/).filter(Boolean);
  if (parts.length === 0) return 'מ';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0]}${parts[1][0]}`;
}

export default function AnonymousAvatar({ nickname, size = 'md' }) {
  const seed = hash(nickname);
  const hue = seed % 360;
  const bg = `linear-gradient(135deg, hsl(${hue} 72% 52%), hsl(${(hue + 46) % 360} 82% 62%))`;

  return (
    <span
      className={`anon-avatar anon-avatar-${size}`}
      style={{ background: bg }}
      aria-label={`אוואטר של ${nickname}`}
      title={nickname}
    >
      {initials(nickname)}
    </span>
  );
}
