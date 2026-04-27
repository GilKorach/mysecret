'use client';

export const AUTH_MODAL_EVENT = 'mysecret:open-auth-modal';

export function openAuthModal(detail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUTH_MODAL_EVENT, { detail }));
}
