import assert from "node:assert/strict";
import test from "node:test";

import {
  RECENT_TERM_HISTORY_KEY,
  createRecentTermHistory,
  createRecencyWeights,
} from "../../src/history/recent-term-history.js";

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) || null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("直近の盤面ほど用語の選択重みを低くする", () => {
  const weights = createRecencyWeights([
    { key: "latest", termIds: ["ethanol", "acetic_acid"] },
    { key: "previous", termIds: ["acetic_acid", "ethylene"] },
  ]);

  assert.equal(weights.ethanol, 0.18);
  assert.equal(weights.acetic_acid, 0.18);
  assert.equal(weights.ethylene, 0.3);
});

test("履歴は同じ盤面を重複記録せず、localStorageへ保存する", () => {
  const storage = createStorage();
  const history = createRecentTermHistory({ storage });

  assert.equal(history.recordPuzzle(["ethanol", "acetic_acid"], "puzzle-a"), true);
  assert.equal(history.recordPuzzle(["ethanol", "acetic_acid"], "puzzle-a"), false);
  assert.equal(history.recordPuzzle(["ethylene"], "puzzle-b"), true);
  assert.equal(history.getPuzzles().length, 2);

  const saved = JSON.parse(storage.getItem(RECENT_TERM_HISTORY_KEY));
  assert.equal(saved.version, 1);
  assert.deepEqual(saved.puzzles[0].termIds, ["ethylene"]);

  history.clear();
  assert.equal(history.getPuzzles().length, 0);
  assert.equal(storage.getItem(RECENT_TERM_HISTORY_KEY), null);
});
