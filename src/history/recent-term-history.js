export const RECENT_TERM_HISTORY_KEY =
  "organic-crossword:aliphatic:recent-terms:v1";
export const RECENT_PUZZLE_LIMIT = 6;

const HISTORY_VERSION = 1;
const RECENCY_WEIGHTS = Object.freeze([0.18, 0.3, 0.42, 0.54, 0.66, 0.78]);

function defaultStorage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function sanitizeRecord(record) {
  if (!record || typeof record !== "object" || !Array.isArray(record.termIds)) {
    return null;
  }

  const termIds = [...new Set(record.termIds.filter((id) => typeof id === "string"))];

  if (termIds.length === 0) {
    return null;
  }

  return {
    key: typeof record.key === "string" ? record.key : "",
    termIds,
  };
}

export function normalizeRecentTermHistory(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.puzzles)) {
    return [];
  }

  return value.puzzles
    .map(sanitizeRecord)
    .filter(Boolean)
    .slice(0, RECENT_PUZZLE_LIMIT);
}

export function createRecencyWeights(puzzles) {
  const weights = Object.create(null);

  normalizeRecentTermHistory({ puzzles }).forEach((puzzle, puzzleIndex) => {
    const multiplier = RECENCY_WEIGHTS[puzzleIndex] || RECENCY_WEIGHTS.at(-1);

    for (const termId of puzzle.termIds) {
      const previous = weights[termId];
      weights[termId] = previous === undefined ? multiplier : Math.min(previous, multiplier);
    }
  });

  return weights;
}

export function createRecentTermHistory(options = {}) {
  const storage = options.storage === undefined ? defaultStorage() : options.storage;
  const storageKey = options.storageKey || RECENT_TERM_HISTORY_KEY;
  let puzzles = [];

  try {
    const stored = storage?.getItem(storageKey);
    puzzles = normalizeRecentTermHistory(stored ? JSON.parse(stored) : null);
  } catch {
    puzzles = [];
  }

  function persist() {
    try {
      storage?.setItem(
        storageKey,
        JSON.stringify({ version: HISTORY_VERSION, puzzles }),
      );
    } catch {
      // localStorageが使えない環境では、このページを開いている間だけ保持する。
    }
  }

  return {
    getPuzzles() {
      return puzzles.map((puzzle) => ({ ...puzzle, termIds: [...puzzle.termIds] }));
    },

    getWeights() {
      return createRecencyWeights(puzzles);
    },

    recordPuzzle(termIds, key = "") {
      const record = sanitizeRecord({ termIds, key });

      if (!record || puzzles[0]?.key === record.key) {
        return false;
      }

      puzzles = [record, ...puzzles].slice(0, RECENT_PUZZLE_LIMIT);
      persist();
      return true;
    },

    clear() {
      puzzles = [];
      try {
        storage?.removeItem(storageKey);
      } catch {
        // localStorageが使えない環境では、メモリ上の履歴だけを消去する。
      }
    },
  };
}
