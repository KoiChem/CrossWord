import assert from "node:assert/strict";
import test from "node:test";

import { createCrossingIndex } from "../../src/generator/crossing-index.js";
import { SeededRandom } from "../../src/generator/seeded-random.js";
import { selectCandidatePool } from "../../src/generator/select-words.js";

const terms = [
  { id: "first", answer: "あいう", category: "test", learningPriority: "A", crosswordPriority: "A" },
  { id: "second", answer: "あえお", category: "test", learningPriority: "A", crosswordPriority: "A" },
  { id: "recent", answer: "あかき", category: "test", learningPriority: "A", crosswordPriority: "A" },
];

const config = {
  width: 7,
  height: 7,
  minWords: 2,
  candidatePoolSize: 2,
  maxFamilyCount: 2,
};

test("選語時に出題履歴による重みを反映する", () => {
  const pool = selectCandidatePool(
    terms,
    config,
    createCrossingIndex(terms),
    new SeededRandom(20260826),
    { recent: 0 },
  );

  assert.equal(pool.some((term) => term.id === "recent"), false);
});
