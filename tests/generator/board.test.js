import assert from "node:assert/strict";
import test from "node:test";

import {
  applyPlacement,
  createBoard,
  getCell,
} from "../../src/generator/board.js";
import { canPlaceTerm } from "../../src/generator/validator.js";

const horizontal = {
  id: "horizontal",
  answer: "あいう",
};
const crossing = {
  id: "crossing",
  answer: "かいき",
};

test("一致文字の直交交差を許可する", () => {
  const board = createBoard(7);
  const first = { row: 3, col: 2, direction: "across" };
  assert.equal(
    canPlaceTerm(board, horizontal, first, { requireCrossing: false }).valid,
    true,
  );
  applyPlacement(board, horizontal, first);

  const second = { row: 2, col: 3, direction: "down" };
  const result = canPlaceTerm(board, crossing, second);
  assert.equal(result.valid, true);
  assert.equal(result.crossings.length, 1);
  applyPlacement(board, crossing, second);
  assert.equal(getCell(board, 3, 3).char, "い");
});

test("一致しない交差、平行重なり、不自然な隣接を拒否する", () => {
  const board = createBoard(7);
  applyPlacement(board, horizontal, { row: 3, col: 2, direction: "across" });

  assert.equal(
    canPlaceTerm(board, { id: "conflict", answer: "かえき" }, {
      row: 2,
      col: 3,
      direction: "down",
    }).reason,
    "character-conflict",
  );

  assert.equal(
    canPlaceTerm(board, { id: "parallel", answer: "あいう" }, {
      row: 3,
      col: 2,
      direction: "across",
    }).reason,
    "same-axis-overlap",
  );

  assert.equal(
    canPlaceTerm(board, { id: "adjacent", answer: "かきく" }, {
      row: 2,
      col: 2,
      direction: "across",
    }).reason,
    "awkward-adjacency",
  );
});
