import { readFileSync } from "node:fs";

const DATA_URL = new URL(
  "../../data/aliphatic_master_v0_1.json",
  import.meta.url,
);

export function loadAliphaticDatasetForTest() {
  return JSON.parse(readFileSync(DATA_URL, "utf8"));
}
