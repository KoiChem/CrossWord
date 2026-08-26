export const ALIPHATIC_DATA_URL = new URL(
  "./aliphatic_master_v0_1.json",
  import.meta.url,
);

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

  return dataset;
}

export function getEnabledEntries(dataset) {
  if (!dataset || !Array.isArray(dataset.entries)) {
    throw new Error("有効な脂肪族データセットではありません。");
  }

  return dataset.entries.filter((entry) => entry.enabledByDefault !== false);
}
