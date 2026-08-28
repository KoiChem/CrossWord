import assert from "node:assert/strict";
import test from "node:test";

import { getInputHint } from "../../src/player/input-hint.js";

const activeWord = {
  number: 4,
  directionLabel: "タテ",
  clue: { text: "銀イオンを還元して銀を析出させる反応。" },
};

test("入力中だけ、アクティブ単語からヒントバー用の表示を作る", () => {
  const player = {
    getMode() {
      return "input";
    },
    getActiveWord() {
      return activeWord;
    },
  };

  assert.deepEqual(getInputHint(player), {
    label: "タテ 4",
    text: "銀イオンを還元して銀を析出させる反応。",
  });
});

test("閲覧中または単語未選択ではヒントバーを表示しない", () => {
  assert.equal(
    getInputHint({ getMode: () => "browse", getActiveWord: () => activeWord }),
    null,
  );
  assert.equal(
    getInputHint({ getMode: () => "input", getActiveWord: () => null }),
    null,
  );
});
