import assert from "node:assert/strict";
import test from "node:test";

import { getPuzzlePreset, PUZZLE_PRESETS } from "../../src/config/puzzle-presets.js";
import { generatePuzzle } from "../../src/generator/generate-puzzle.js";
import { validateGeneratedPuzzle } from "../../src/generator/validator.js";
import { loadAliphaticDatasetForTest } from "../helpers/load-aliphatic-dataset.js";

const dataset = loadAliphaticDatasetForTest();

for (const presetId of Object.keys(PUZZLE_PRESETS)) {
  test(presetId + " は同じseedで再現でき、最低語数を満たす", () => {
    const config = getPuzzlePreset(presetId);
    const first = generatePuzzle({
      terms: dataset.entries,
      config,
      seed: 20260826,
    });
    const second = generatePuzzle({
      terms: dataset.entries,
      config,
      seed: 20260826,
    });
    const validation = validateGeneratedPuzzle(first, dataset.entries, config);

    assert.equal(validation.valid, true, validation.errors.join("\n"));
    assert.ok(first.placements.length >= config.minWords);
    assert.equal(first.debug.fingerprint, second.debug.fingerprint);
    assert.deepEqual(first.placements, second.placements);
  });
}

test("各プリセットで100回連続生成して必須制約を守る", { timeout: 120000 }, () => {
  for (const presetId of Object.keys(PUZZLE_PRESETS)) {
    const config = getPuzzlePreset(presetId);

    for (let seed = 1; seed <= 100; seed += 1) {
      const puzzle = generatePuzzle({
        terms: dataset.entries,
        config,
        seed,
      });
      const validation = validateGeneratedPuzzle(puzzle, dataset.entries, config);

      assert.equal(
        validation.valid,
        true,
        presetId + " seed=" + seed + "\n" + validation.errors.join("\n"),
      );
      assert.ok(
        puzzle.placements.length >= config.minWords,
        presetId + " seed=" + seed + " の語数が不足しています。",
      );
    }
  }
});
