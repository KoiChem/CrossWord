import {
  DIRECTIONS,
  applyPlacement,
  createBoard,
  getCell,
  isInBounds,
  isOccupied,
  oppositeDirection,
  placementCells,
} from "./board.js";

const ANSWER_PATTERN = /^[ぁ-んゔー]+$/u;
const LEARNING_PRIORITIES = new Set(["A", "B", "C"]);
const CROSSWORD_PRIORITIES = new Set(["A", "B", "C"]);

function addError(errors, message) {
  errors.push(message);
}

function familyKey(term) {
  return term.family || null;
}

export function countFamilies(terms) {
  const counts = new Map();

  for (const term of terms) {
    const key = familyKey(term);
    if (!key) {
      continue;
    }
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return counts;
}

export function validateDataset(dataset) {
  const errors = [];

  if (!dataset || !Array.isArray(dataset.entries)) {
    return {
      valid: false,
      errors: ["データセットに entries 配列がありません。"],
    };
  }

  const ids = new Set();
  const answers = new Set();

  for (const entry of dataset.entries) {
    const label = entry && entry.id ? entry.id : "(IDなし)";

    if (!entry || typeof entry !== "object") {
      addError(errors, "用語データがオブジェクトではありません。");
      continue;
    }

    for (const field of [
      "id",
      "displayName",
      "answer",
      "category",
      "learningPriority",
      "crosswordPriority",
    ]) {
      if (!entry[field]) {
        addError(errors, label + ": " + field + " がありません。");
      }
    }

    if (ids.has(entry.id)) {
      addError(errors, label + ": id が重複しています。");
    }
    ids.add(entry.id);

    if (typeof entry.answer !== "string" || !ANSWER_PATTERN.test(entry.answer)) {
      addError(errors, label + ": answer に許可されない文字があります。");
    }

    if (
      typeof entry.answer === "string" &&
      entry.answer.normalize("NFC") !== entry.answer
    ) {
      addError(errors, label + ": answer はNFC正規化済みである必要があります。");
    }

    if (
      Number.isInteger(entry.answerLength) &&
      typeof entry.answer === "string" &&
      Array.from(entry.answer).length !== entry.answerLength
    ) {
      addError(errors, label + ": answerLength がanswerと一致しません。");
    }

    if (!Number.isInteger(entry.answerLength)) {
      addError(errors, label + ": answerLength は整数で指定してください。");
    }

    if (answers.has(entry.answer)) {
      addError(errors, label + ": canonical answer が重複しています。");
    }
    answers.add(entry.answer);

    if (entry.family !== null && typeof entry.family !== "string") {
      addError(errors, label + ": family は文字列またはnullです。");
    }

    if (!LEARNING_PRIORITIES.has(entry.learningPriority)) {
      addError(errors, label + ": learningPriority はA/B/Cです。");
    }

    if (!CROSSWORD_PRIORITIES.has(entry.crosswordPriority)) {
      addError(errors, label + ": crosswordPriority はA/B/Cです。");
    }

    if (!Array.isArray(entry.clues) || entry.clues.length === 0) {
      addError(errors, label + ": clues が1件以上必要です。");
    } else {
      for (const clue of entry.clues) {
        if (!clue || !Number.isInteger(clue.level) || !clue.type || !clue.text) {
          addError(errors, label + ": clueの形式が不正です。");
        }
      }
    }

    if (!Array.isArray(entry.aliases)) {
      addError(errors, label + ": aliases は配列です。");
    }

    if (!Array.isArray(entry.sourceKeys) || entry.sourceKeys.length === 0) {
      addError(errors, label + ": sourceKeys が1件以上必要です。");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidDataset(dataset) {
  const result = validateDataset(dataset);

  if (!result.valid) {
    throw new Error("教材データが不正です。\n" + result.errors.join("\n"));
  }
}

function perpendicularNeighbors(direction, row, col) {
  if (direction === "across") {
    return [
      { row: row - 1, col },
      { row: row + 1, col },
    ];
  }

  return [
    { row, col: col - 1 },
    { row, col: col + 1 },
  ];
}

export function canPlaceTerm(board, term, placement, options = {}) {
  const requireCrossing = options.requireCrossing !== false;
  const direction = DIRECTIONS[placement.direction];

  if (!direction) {
    return { valid: false, reason: "unknown-direction", crossings: [] };
  }

  const positions = placementCells(term, placement);

  if (
    positions.some((position) => !isInBounds(board, position.row, position.col))
  ) {
    return { valid: false, reason: "out-of-bounds", crossings: [] };
  }

  const before = {
    row: placement.row - direction.rowDelta,
    col: placement.col - direction.colDelta,
  };
  const last = positions[positions.length - 1];
  const after = {
    row: last.row + direction.rowDelta,
    col: last.col + direction.colDelta,
  };

  if (isOccupied(board, before.row, before.col) || isOccupied(board, after.row, after.col)) {
    return { valid: false, reason: "word-end-touch", crossings: [] };
  }

  const sameAxisKey = placement.direction === "across" ? "acrossId" : "downId";
  const otherAxisKey =
    placement.direction === "across" ? "downId" : "acrossId";
  const crossings = [];

  for (const position of positions) {
    const cell = getCell(board, position.row, position.col);

    if (cell) {
      if (cell.char !== position.char) {
        return { valid: false, reason: "character-conflict", crossings: [] };
      }

      if (cell[sameAxisKey]) {
        return { valid: false, reason: "same-axis-overlap", crossings: [] };
      }

      crossings.push({
        row: position.row,
        col: position.col,
        char: position.char,
        wordId: cell[otherAxisKey],
      });
      continue;
    }

    for (const neighbor of perpendicularNeighbors(
      placement.direction,
      position.row,
      position.col,
    )) {
      if (isOccupied(board, neighbor.row, neighbor.col)) {
        return { valid: false, reason: "awkward-adjacency", crossings: [] };
      }
    }
  }

  if (requireCrossing && crossings.length === 0) {
    return { valid: false, reason: "not-connected", crossings: [] };
  }

  return { valid: true, reason: null, crossings };
}

export function buildWordGraph(board, placements) {
  const graph = new Map(placements.map((placement) => [placement.wordId, new Set()]));

  for (const cell of board.cells) {
    if (!cell || !cell.acrossId || !cell.downId) {
      continue;
    }

    graph.get(cell.acrossId)?.add(cell.downId);
    graph.get(cell.downId)?.add(cell.acrossId);
  }

  return graph;
}

export function isConnected(board, placements) {
  if (placements.length === 0) {
    return false;
  }

  const graph = buildWordGraph(board, placements);
  const visited = new Set();
  const queue = [placements[0].wordId];

  while (queue.length > 0) {
    const wordId = queue.shift();
    if (visited.has(wordId)) {
      continue;
    }

    visited.add(wordId);
    for (const neighbor of graph.get(wordId) || []) {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  return visited.size === placements.length;
}

export function validateGeneratedPuzzle(puzzle, terms, config) {
  const errors = [];
  const termById = new Map(terms.map((term) => [term.id, term]));
  const board = createBoard(puzzle.board.width, puzzle.board.height);
  const reconstructedPlacements = [];

  if (puzzle.placements.length < config.minWords) {
    addError(errors, "最低語数を満たしていません。");
  }

  if (puzzle.placements.length > config.maxWords) {
    addError(errors, "最大語数を超えています。");
  }

  for (const [index, placement] of puzzle.placements.entries()) {
    const term = termById.get(placement.wordId);

    if (!term) {
      addError(errors, "未知の用語IDが配置されています: " + placement.wordId);
      continue;
    }

    const result = canPlaceTerm(board, term, placement, {
      requireCrossing: index > 0,
    });

    if (!result.valid) {
      addError(
        errors,
        placement.wordId + " を再構築できません: " + result.reason,
      );
      continue;
    }

    applyPlacement(board, term, placement);
    reconstructedPlacements.push(placement);
  }

  if (
    reconstructedPlacements.length > 0 &&
    !isConnected(board, reconstructedPlacements)
  ) {
    addError(errors, "配置語が連結していません。");
  }

  const placedTerms = reconstructedPlacements
    .map((placement) => termById.get(placement.wordId))
    .filter(Boolean);

  for (const [family, count] of countFamilies(placedTerms)) {
    if (count > config.maxFamilyCount) {
      addError(errors, "family上限を超えています: " + family);
    }
  }

  for (let row = 0; row < board.height; row += 1) {
    for (let col = 0; col < board.width; col += 1) {
      const expected = getCell(puzzle.board, row, col);
      const actual = getCell(board, row, col);

      if (
        Boolean(expected) !== Boolean(actual) ||
        (expected && actual && expected.char !== actual.char)
      ) {
        addError(errors, "盤面セルが再構築結果と一致しません。");
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    board,
  };
}
