const STORAGE_KEY = "organic-crossword-player-preferences-v1";

export const DEFAULT_PLAYER_PREFERENCES = Object.freeze({
  showCorrectColors: true,
  soundEnabled: true,
});

function normalizePreferences(value) {
  return {
    showCorrectColors: value?.showCorrectColors !== false,
    soundEnabled: value?.soundEnabled !== false,
  };
}

function defaultStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function createPlayerPreferences(storage = defaultStorage()) {
  let current = { ...DEFAULT_PLAYER_PREFERENCES };

  try {
    const stored = storage?.getItem(STORAGE_KEY);
    if (stored) {
      current = normalizePreferences(JSON.parse(stored));
    }
  } catch {
    // Privacy mode and storage limits must not prevent the puzzle from starting.
  }

  function persist() {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // The in-memory preference remains available for this play session.
    }
  }

  function update(partial) {
    current = normalizePreferences({ ...current, ...partial });
    persist();
    return get();
  }

  function get() {
    return { ...current };
  }

  return { get, update };
}
