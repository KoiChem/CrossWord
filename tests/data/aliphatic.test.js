import assert from "node:assert/strict";
import test from "node:test";

import { ALIPHATIC_CORE_CLUES } from "../../data/aliphatic-core-clues.js";
import { validateDataset } from "../../src/generator/validator.js";
import { loadAliphaticDatasetForTest } from "../helpers/load-aliphatic-dataset.js";

test("脂肪族マスターデータは100語で、Generatorの入力要件を満たす", () => {
  const dataset = loadAliphaticDatasetForTest();
  const validation = validateDataset(dataset);

  assert.equal(dataset.meta.entryCount, 100);
  assert.equal(dataset.entries.length, 100);
  assert.equal(validation.valid, true, validation.errors.join("\n"));
});

test("優先度Aの脂肪族コア63語には定義と文脈型の2段階ヒントがある", () => {
  const dataset = loadAliphaticDatasetForTest();
  const coreTerms = dataset.entries.filter(
    (entry) => entry.learningPriority === "A",
  );

  assert.equal(coreTerms.length, 63);
  assert.equal(Object.keys(ALIPHATIC_CORE_CLUES).length, 63);

  for (const term of coreTerms) {
    assert.ok(ALIPHATIC_CORE_CLUES[term.id], term.id + " の補助ヒントがありません。");
    assert.deepEqual(
      term.clues.map((clue) => clue.level).sort((left, right) => left - right),
      [1, 2],
      term.id + " のヒント難易度が不正です。",
    );
  }
});
