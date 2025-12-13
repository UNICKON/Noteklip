const isBrowser = typeof window !== 'undefined';

export function loadSessionState(key) {
  if (!isBrowser || !key) return null;
  try {
    const stored = window.sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    console.warn('Failed to parse session state for', key, err);
    return null;
  }
}

export function saveSessionState(key, value) {
  if (!isBrowser || !key) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Failed to persist session state for', key, err);
  }
}
