import assert from "node:assert/strict";
import test from "node:test";

import { validateDataset } from "../../src/generator/validator.js";
import { loadAliphaticDatasetForTest } from "../helpers/load-aliphatic-dataset.js";

test("脂肪族マスターデータは100語で、Generatorの入力要件を満たす", () => {
  const dataset = loadAliphaticDatasetForTest();
  const validation = validateDataset(dataset);

  assert.equal(dataset.meta.entryCount, 100);
  assert.equal(dataset.entries.length, 100);
  assert.equal(validation.valid, true, validation.errors.join("\n"));
});
