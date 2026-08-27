import { readFileSync } from "node:fs";

import { enrichAliphaticDataset } from "../../data/aliphatic.js";

const DATA_URL = new URL(
  "../../data/aliphatic_master_v0_1.json",
  import.meta.url,
);

export function loadAliphaticDatasetForTest() {
  return enrichAliphaticDataset(JSON.parse(readFileSync(DATA_URL, "utf8")));
}
