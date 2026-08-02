let _locks = 0;

export function lockBodyScroll() {
  _locks += 1;
  if (_locks === 1) {
    document.body.style.overflow = 'hidden';
  }
}

export function unlockBodyScroll() {
  _locks = Math.max(0, _locks - 1);
  if (_locks === 0) {
    document.body.style.overflow = '';
  }
}

export function resetBodyScrollLock() {
  _locks = 0;
  document.body.style.overflow = '';
}
