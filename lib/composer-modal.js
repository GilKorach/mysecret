'use client';

export const COMPOSER_MODAL_EVENT = 'mysecret:open-composer-modal';

export function openComposerModal() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(COMPOSER_MODAL_EVENT));
}
