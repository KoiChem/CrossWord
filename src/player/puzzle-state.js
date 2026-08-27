import { DIRECTIONS, getCell } from "../generator/board.js";
import { selectClueForLevel } from "./clue-selector.js";

function cellKey(row, col) {
  return row + ":" + col;
}

function directionLabel(direction) {
  return direction === "across" ? "ヨコ" : "タテ";
}

function buildWords(puzzle, termById, clueLevel) {
  const numbersByStart = new Map();
  let nextNumber = 1;

  const starts = [...puzzle.placements]
    .map((placement) => ({ row: placement.row, col: placement.col }))
    .sort((left, right) => left.row - right.row || left.col - right.col);

  for (const start of starts) {
    const key = cellKey(start.row, start.col);
    if (!numbersByStart.has(key)) {
      numbersByStart.set(key, nextNumber);
      nextNumber += 1;
    }
  }

  return puzzle.placements
    .map((placement) => {
      const term = termById.get(placement.wordId);
      const direction = DIRECTIONS[placement.direction];
      const cells = Array.from(term.answer).map((target, index) => {
        const row = placement.row + direction.rowDelta * index;
        const col = placement.col + direction.colDelta * index;
        return { row, col, key: cellKey(row, col), target, index };
      });

      return {
        id: placement.wordId,
        number: numbersByStart.get(cellKey(placement.row, placement.col)),
        direction: placement.direction,
        directionLabel: directionLabel(placement.direction),
        category: term.category,
        clue: selectClueForLevel(term, clueLevel),
        cells,
      };
    })
    .sort(
      (left, right) =>
        left.number - right.number ||
        (left.direction === "across" ? -1 : 1) -
          (right.direction === "across" ? -1 : 1),
    );
}

export function createPuzzleState(puzzle, terms, options = {}) {
  const termById = new Map(terms.map((term) => [term.id, term]));
  const words = buildWords(puzzle, termById, options.clueLevel);
  const wordById = new Map(words.map((word) => [word.id, word]));
  const wordIdsByCell = new Map();
  const inputByCell = new Map();
  const compositionPreviewByCell = new Map();
  const correctWordIds = new Set();

  for (const word of words) {
    for (const cell of word.cells) {
      const wordIds = wordIdsByCell.get(cell.key) || [];
      wordIds.push(word.id);
      wordIdsByCell.set(cell.key, wordIds);
    }
  }

  let activeWordId = words[0]?.id || null;
  let activeCellKey = words[0]?.cells[0]?.key || null;
  let mode = "browse";

  function getActiveWord() {
    return wordById.get(activeWordId) || null;
  }

  function isCellLocked(key) {
    return (wordIdsByCell.get(key) || []).some((wordId) =>
      correctWordIds.has(wordId),
    );
  }

  function wordIsCorrect(word) {
    return word.cells.every((cell) => inputByCell.get(cell.key) === cell.target);
  }

  function confirmCompletedWords() {
    const newlyCorrectWordIds = [];

    for (const word of words) {
      if (!correctWordIds.has(word.id) && wordIsCorrect(word)) {
        correctWordIds.add(word.id);
        newlyCorrectWordIds.push(word.id);
      }
    }

    return newlyCorrectWordIds;
  }

  function result(changed, newlyCorrectWordIds = []) {
    return {
      changed,
      newlyCorrectWordIds,
      completed: correctWordIds.size === words.length,
    };
  }

  function clearCompositionPreview() {
    const changed = compositionPreviewByCell.size > 0;
    compositionPreviewByCell.clear();
    return changed;
  }

  function selectWord(wordId, options = {}) {
    const word = wordById.get(wordId);
    if (!word) {
      return result(false);
    }

    const previewChanged = clearCompositionPreview();
    const previousWordId = activeWordId;
    const previousCellKey = activeCellKey;
    activeWordId = word.id;
    const firstOpenCell = options.firstOpenCell
      ? word.cells.find((cell) => !inputByCell.get(cell.key) && !isCellLocked(cell.key))
      : null;
    activeCellKey = (firstOpenCell || word.cells[0]).key;
    return result(
      previewChanged || previousWordId !== activeWordId || previousCellKey !== activeCellKey,
    );
  }

  function selectCell(row, col) {
    const boardCell = getCell(puzzle.board, row, col);
    if (!boardCell) {
      return result(false);
    }

    const key = cellKey(row, col);
    const availableDirections = ["across", "down"].filter(
      (direction) => boardCell[direction + "Id"],
    );
    const activeWord = getActiveWord();
    let direction = activeWord?.direction;

    if (!availableDirections.includes(direction)) {
      direction = availableDirections[0];
    }

    const previewChanged = clearCompositionPreview();
    const previousWordId = activeWordId;
    const previousCellKey = activeCellKey;
    activeWordId = boardCell[direction + "Id"];
    activeCellKey = key;
    return result(
      previewChanged || previousWordId !== activeWordId || previousCellKey !== activeCellKey,
    );
  }

  function selectDirection(direction) {
    if (direction !== "across" && direction !== "down") {
      return result(false);
    }

    const activeWord = getActiveWord();
    const activeCell = activeWord?.cells.find((cell) => cell.key === activeCellKey);
    const boardCell = activeCell && getCell(puzzle.board, activeCell.row, activeCell.col);
    const nextWordId = boardCell?.[direction + "Id"];

    if (!nextWordId) {
      return result(false);
    }

    const previewChanged = clearCompositionPreview();
    const changed = previewChanged || activeWordId !== nextWordId;
    activeWordId = nextWordId;
    return result(changed);
  }

  function toggleDirection() {
    const activeWord = getActiveWord();
    return selectDirection(activeWord?.direction === "across" ? "down" : "across");
  }

  function enterInputMode() {
    if (!getActiveWord() || mode === "input") {
      return result(false);
    }

    mode = "input";
    return result(true);
  }

  function exitInputMode() {
    const previewChanged = clearCompositionPreview();
    if (mode !== "input" && !previewChanged) {
      return result(false);
    }

    mode = "browse";
    return result(true);
  }

  function setCompositionPreview(characters) {
    const activeWord = getActiveWord();
    if (!activeWord || !Array.isArray(characters)) {
      return result(false);
    }

    const before = JSON.stringify([...compositionPreviewByCell]);
    compositionPreviewByCell.clear();
    let index = Math.max(
      0,
      activeWord.cells.findIndex((cell) => cell.key === activeCellKey),
    );

    for (const character of characters) {
      const cell = activeWord.cells[index];
      if (!cell) {
        break;
      }

      if (!isCellLocked(cell.key)) {
        compositionPreviewByCell.set(cell.key, character);
      }

      if (index < activeWord.cells.length - 1) {
        index += 1;
      }
    }

    return result(before !== JSON.stringify([...compositionPreviewByCell]));
  }

  function enterCharacters(characters) {
    const activeWord = getActiveWord();
    if (!activeWord || !Array.isArray(characters) || characters.length === 0) {
      return result(false);
    }

    const previewChanged = clearCompositionPreview();
    let index = Math.max(
      0,
      activeWord.cells.findIndex((cell) => cell.key === activeCellKey),
    );
    let changed = false;

    for (const character of characters) {
      const cell = activeWord.cells[index];
      if (!cell) {
        break;
      }

      if (!isCellLocked(cell.key) && inputByCell.get(cell.key) !== character) {
        inputByCell.set(cell.key, character);
        changed = true;
      }

      if (index < activeWord.cells.length - 1) {
        index += 1;
      }
    }

    activeCellKey = activeWord.cells[index].key;
    return result(changed || previewChanged, confirmCompletedWords());
  }

  function backspace() {
    const activeWord = getActiveWord();
    if (!activeWord) {
      return result(false);
    }

    let index = activeWord.cells.findIndex((cell) => cell.key === activeCellKey);
    if (index < 0) {
      return result(false);
    }

    const current = activeWord.cells[index];
    if (!isCellLocked(current.key) && inputByCell.has(current.key)) {
      inputByCell.delete(current.key);
      return result(true);
    }

    while (index > 0) {
      index -= 1;
      const previous = activeWord.cells[index];
      if (isCellLocked(previous.key)) {
        continue;
      }

      activeCellKey = previous.key;
      if (inputByCell.has(previous.key)) {
        inputByCell.delete(previous.key);
        return result(true);
      }
      return result(true);
    }

    return result(false);
  }

  function move(delta) {
    const activeWord = getActiveWord();
    if (!activeWord) {
      return result(false);
    }

    const index = activeWord.cells.findIndex((cell) => cell.key === activeCellKey);
    const next = activeWord.cells[index + delta];
    if (!next) {
      return result(false);
    }

    activeCellKey = next.key;
    return result(true);
  }

  function reset() {
    inputByCell.clear();
    compositionPreviewByCell.clear();
    correctWordIds.clear();
    activeWordId = words[0]?.id || null;
    activeCellKey = words[0]?.cells[0]?.key || null;
    mode = "browse";
    return result(true);
  }

  return {
    puzzle,
    words,
    selectCell,
    selectWord,
    selectDirection,
    toggleDirection,
    enterInputMode,
    exitInputMode,
    setCompositionPreview,
    enterCharacters,
    backspace,
    move,
    reset,
    getActiveWord,
    getActiveCellKey() {
      return activeCellKey;
    },
    getMode() {
      return mode;
    },
    getAvailableDirections() {
      const activeWord = getActiveWord();
      const activeCell = activeWord?.cells.find((cell) => cell.key === activeCellKey);
      const boardCell = activeCell && getCell(puzzle.board, activeCell.row, activeCell.col);
      return ["across", "down"].filter((direction) =>
        Boolean(boardCell?.[direction + "Id"]),
      );
    },
    getCellInput(row, col) {
      return inputByCell.get(cellKey(row, col)) || "";
    },
    getCellPreview(row, col) {
      return compositionPreviewByCell.get(cellKey(row, col)) || "";
    },
    getCellDisplayInput(row, col) {
      return (
        compositionPreviewByCell.get(cellKey(row, col)) ||
        inputByCell.get(cellKey(row, col)) ||
        ""
      );
    },
    isCellLocked,
    isWordCorrect(wordId) {
      return correctWordIds.has(wordId);
    },
    getProgress() {
      return { correct: correctWordIds.size, total: words.length };
    },
    isComplete() {
      return words.length > 0 && correctWordIds.size === words.length;
    },
  };
}
