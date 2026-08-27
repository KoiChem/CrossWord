import assert from "node:assert/strict";
import test from "node:test";

import { selectClueForLevel } from "../../src/player/clue-selector.js";

const term = {
  id: "sample",
  clues: [
    { level: 3, type: "reaction", text: "レベル3" },
    { level: 1, type: "definition", text: "レベル1" },
    { level: 2, type: "property", text: "レベル2" },
  ],
};

test("指定レベル以下で最も難しいヒントを選ぶ", () => {
  assert.equal(selectClueForLevel(term, 1).text, "レベル1");
  assert.equal(selectClueForLevel(term, 2).text, "レベル2");
  assert.equal(selectClueForLevel(term, 3).text, "レベル3");
});

test("指定レベル以下のヒントがない場合も、最も基本のヒントを返す", () => {
  assert.equal(
    selectClueForLevel({ id: "advanced", clues: [term.clues[0]] }, 1).text,
    "レベル3",
  );
});
