import assert from "node:assert/strict";
import test from "node:test";

import { normalizeAnswerInput } from "../../src/player/answer-normalizer.js";

test("カタカナ・半角カタカナをひらがなに正規化する", () => {
  assert.deepEqual(normalizeAnswerInput("エタノール"), ["え", "た", "の", "ー", "る"]);
  assert.deepEqual(normalizeAnswerInput("ｴﾀﾉｰﾙ"), ["え", "た", "の", "ー", "る"]);
});

test("小書きかな、ゔ、長音符を残し、許可外文字を確定させない", () => {
  assert.deepEqual(normalizeAnswerInput("キャット・ヴァイオリン A1"), [
    "き",
    "ゃ",
    "っ",
    "と",
    "ゔ",
    "ぁ",
    "い",
    "お",
    "り",
    "ん",
  ]);
  assert.deepEqual(normalizeAnswerInput("ゔー"), ["ゔ", "ー"]);
});
