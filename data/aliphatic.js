import { ALIPHATIC_CORE_CLUES } from "./aliphatic-core-clues.js";

export const ALIPHATIC_DATA_URL = new URL(
  "./aliphatic_master_v0_1.json",
  import.meta.url,
);

function cloneClue(clue) {
  return { ...clue };
}

// Keep the attached master JSON as the auditable source of truth. Phase 4
// adds contextual hints only at load time, so answer spellings and source data
// remain easy to review independently.
export function enrichAliphaticDataset(dataset) {
  if (!dataset || !Array.isArray(dataset.entries)) {
    throw new Error("脂肪族データに entries 配列がありません。");
  }

  return {
    ...dataset,
    entries: dataset.entries.map((entry) => {
      const supplementalClue = ALIPHATIC_CORE_CLUES[entry.id];
      const clues = (entry.clues || []).map(cloneClue);

      if (
        supplementalClue &&
        !clues.some((clue) => clue.level === supplementalClue.level)
      ) {
        clues.push(cloneClue(supplementalClue));
      }

      return { ...entry, clues };
    }),
  };
}

export async function loadAliphaticDataset() {
  const response = await fetch(ALIPHATIC_DATA_URL);

  if (!response.ok) {
    throw new Error(
      "脂肪族データを読み込めませんでした: HTTP " + response.status,
    );
  }

  const dataset = await response.json();

  if (!Array.isArray(dataset.entries)) {
    throw new Error("脂肪族データに entries 配列がありません。");
  }

  return enrichAliphaticDataset(dataset);
}

export function getEnabledEntries(dataset) {
  if (!dataset || !Array.isArray(dataset.entries)) {
    throw new Error("有効な脂肪族データセットではありません。");
  }

  return dataset.entries.filter((entry) => entry.enabledByDefault !== false);
}
