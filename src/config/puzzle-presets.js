const SHARED_LIMITS = Object.freeze({
  poolAttempts: 3,
  maxRestarts: 12,
  maxTotalNodes: 40000,
  maxCandidatesPerWord: 24,
  maxWordGroupsPerDepth: 3,
  retainedCandidates: 8,
  // One dense target candidate is enough because all retained layouts are still
  // score-compared. Requiring many of them makes mobile generation needlessly slow.
  targetQualifiedCandidates: 1,
});

export const PUZZLE_PRESETS = Object.freeze({
  easy: Object.freeze({
    id: "easy",
    label: "EASY",
    width: 7,
    height: 7,
    minWords: 4,
    targetWords: 4,
    maxWords: 5,
    candidatePoolSize: 18,
    clueLevel: 1,
    maxFamilyCount: 1,
    softFamilyCount: 1,
    targetExtraCrossings: 0,
    densitySearchNodeLimit: 80,
    ...SHARED_LIMITS,
  }),
  normal: Object.freeze({
    id: "normal",
    label: "NORMAL",
    width: 9,
    height: 9,
    minWords: 5,
    targetWords: 6,
    maxWords: 7,
    candidatePoolSize: 26,
    clueLevel: 2,
    maxFamilyCount: 2,
    softFamilyCount: 1,
    targetExtraCrossings: 1,
    densitySearchNodeLimit: 220,
    ...SHARED_LIMITS,
  }),
  hard: Object.freeze({
    id: "hard",
    label: "HARD",
    width: 11,
    height: 11,
    minWords: 7,
    targetWords: 8,
    maxWords: 9,
    candidatePoolSize: 34,
    clueLevel: 3,
    maxFamilyCount: 2,
    softFamilyCount: 1,
    // 11×11でもタップしやすい語数を保つため、まずは連結に必要な数より
    // 1交差多い盤面を安定して選ぶ。2交差以上はスコアで引き続き優先する。
    targetExtraCrossings: 1,
    densitySearchNodeLimit: 320,
    ...SHARED_LIMITS,
  }),
});

export function getPuzzlePreset(id) {
  const preset = PUZZLE_PRESETS[id];

  if (!preset) {
    throw new Error("不明なパズルプリセットです: " + id);
  }

  return { ...preset };
}
