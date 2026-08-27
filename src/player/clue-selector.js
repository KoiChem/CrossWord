function byLevel(left, right) {
  return left.level - right.level;
}

// Prefer the highest clue level that does not exceed the preset's target.
// If a term has not yet been authored at that level, retain a usable lower
// level clue instead of making the puzzle unavailable.
export function selectClueForLevel(term, targetLevel = 1) {
  const clues = Array.isArray(term?.clues) ? [...term.clues].sort(byLevel) : [];

  if (clues.length === 0) {
    throw new Error("用語に利用できるヒントがありません: " + (term?.id || "(IDなし)"));
  }

  const requestedLevel = Number.isInteger(targetLevel) ? targetLevel : 1;
  const eligible = clues.filter((clue) => clue.level <= requestedLevel);

  return eligible[eligible.length - 1] || clues[0];
}
