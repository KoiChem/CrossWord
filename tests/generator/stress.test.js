import assert from "node:assert/strict";
import test from "node:test";

import { getPuzzlePreset, PUZZLE_PRESETS } from "../../src/config/puzzle-presets.js";
import { generatePuzzle } from "../../src/generator/generate-puzzle.js";
import { validateGeneratedPuzzle } from "../../src/generator/validator.js";
import { loadAliphaticDatasetForTest } from "../helpers/load-aliphatic-dataset.js";

const shouldRunStress = process.env.RUN_STRESS === "1";
const dataset = loadAliphaticDatasetForTest();

test(
  "各プリセットで1000回連続生成する",
  { skip: !shouldRunStress, timeout: 600000 },
  () => {
    for (const presetId of Object.keys(PUZZLE_PRESETS)) {
      const config = getPuzzlePreset(presetId);
      const durations = [];

      for (let seed = 1; seed <= 1000; seed += 1) {
        const startedAt = performance.now();
        const puzzle = generatePuzzle({
          terms: dataset.entries,
          config,
          seed,
        });
        durations.push(performance.now() - startedAt);
        const validation = validateGeneratedPuzzle(puzzle, dataset.entries, config);

        assert.equal(
          validation.valid,
          true,
          presetId + " seed=" + seed + "\n" + validation.errors.join("\n"),
        );
      }

      durations.sort((left, right) => left - right);
      const p95 = durations[Math.floor(durations.length * 0.95)];
      console.log(
        presetId +
          " 1000 seeds: median=" +
          durations[Math.floor(durations.length / 2)].toFixed(1) +
          "ms p95=" +
          p95.toFixed(1) +
          "ms max=" +
          durations[durations.length - 1].toFixed(1) +
          "ms",
      );
    }
  },
);
