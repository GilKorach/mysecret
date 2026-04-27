'use client';

export default function FloatingWriteButton({ onClick }) {
  return (
    <button className="fab-write" type="button" onClick={onClick} aria-label="כתוב סוד">
      <span>+</span>
      <span>כתוב סוד</span>
    </button>
  );
}
