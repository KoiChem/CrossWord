import assert from "node:assert/strict";
import test from "node:test";

import { applyPlacement, createBoard } from "../../src/generator/board.js";
import { createPuzzleState } from "../../src/player/puzzle-state.js";

const terms = [
  {
    id: "across",
    displayName: "ヨコ語",
    answer: "あいう",
    category: "テスト",
    clues: [{ level: 1, type: "definition", text: "ヨコのヒント" }],
  },
  {
    id: "down",
    displayName: "タテ語",
    answer: "えいお",
    category: "テスト",
    clues: [{ level: 1, type: "definition", text: "タテのヒント" }],
  },
];

function createPuzzle() {
  const board = createBoard(3, 3);
  applyPlacement(board, terms[0], { row: 1, col: 0, direction: "across" });
  applyPlacement(board, terms[1], { row: 0, col: 1, direction: "down" });
  return {
    board,
    placements: [
      { wordId: "across", row: 1, col: 0, direction: "across" },
      { wordId: "down", row: 0, col: 1, direction: "down" },
    ],
  };
}

test("交差マスは選択中の方向を維持し、明示操作でタテ・ヨコを切り替える", () => {
  const state = createPuzzleState(createPuzzle(), terms);
  state.selectWord("across");
  state.selectCell(1, 1);
  assert.equal(state.getActiveWord().id, "across");
  state.selectCell(1, 1);
  assert.equal(state.getActiveWord().id, "across");
  state.selectDirection("down");
  assert.equal(state.getActiveWord().id, "down");
});

test("閲覧モードと入力モードを分け、IMEプレビューは確定回答を変えない", () => {
  const state = createPuzzleState(createPuzzle(), terms);

  assert.equal(state.getMode(), "browse");
  state.selectWord("across");
  state.enterInputMode();
  assert.equal(state.getMode(), "input");

  state.setCompositionPreview(["あ", "い"]);
  assert.equal(state.getCellInput(1, 0), "");
  assert.equal(state.getCellDisplayInput(1, 0), "あ");
  assert.equal(state.getCellDisplayInput(1, 1), "い");

  state.enterCharacters(["あ", "い"]);
  assert.equal(state.getCellInput(1, 0), "あ");
  assert.equal(state.getCellInput(1, 1), "い");
  assert.equal(state.getCellPreview(1, 0), "");

  state.exitInputMode();
  assert.equal(state.getMode(), "browse");
});

test("入力した正解語を固定し、交差語の完成で全問正解になる", () => {
  const state = createPuzzleState(createPuzzle(), terms);
  state.selectWord("across");
  const first = state.enterCharacters(["あ", "い", "う"]);

  assert.deepEqual(first.newlyCorrectWordIds, ["across"]);
  assert.equal(state.isCellLocked("1:1"), true);

  state.selectWord("down", { firstOpenCell: true });
  const second = state.enterCharacters(["え", "い", "お"]);
  assert.deepEqual(second.newlyCorrectWordIds, ["down"]);
  assert.equal(second.completed, true);
  assert.deepEqual(state.getProgress(), { correct: 2, total: 2 });
});

test("Backspaceは空マスから前の編集可能マスへ戻る", () => {
  const state = createPuzzleState(createPuzzle(), terms);
  state.selectWord("across");
  state.enterCharacters(["あ"]);
  state.backspace();

  assert.equal(state.getActiveCellKey(), "1:0");
  assert.equal(state.getCellInput(1, 0), "");
});
