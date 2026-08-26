export const DIRECTIONS = Object.freeze({
  across: Object.freeze({ key: "across", rowDelta: 0, colDelta: 1 }),
  down: Object.freeze({ key: "down", rowDelta: 1, colDelta: 0 }),
});

export function oppositeDirection(direction) {
  return direction === "across" ? "down" : "across";
}

export function createBoard(width, height = width) {
  return {
    width,
    height,
    cells: Array(width * height).fill(null),
  };
}

export function cloneBoard(board) {
  return {
    width: board.width,
    height: board.height,
    cells: board.cells.map((cell) => (cell ? { ...cell } : null)),
  };
}

export function isInBounds(board, row, col) {
  return row >= 0 && row < board.height && col >= 0 && col < board.width;
}

export function cellIndex(board, row, col) {
  return row * board.width + col;
}

export function getCell(board, row, col) {
  if (!isInBounds(board, row, col)) {
    return undefined;
  }

  return board.cells[cellIndex(board, row, col)];
}

export function isOccupied(board, row, col) {
  return Boolean(getCell(board, row, col));
}

export function placementCells(term, placement) {
  const direction = DIRECTIONS[placement.direction];
  const characters = Array.from(term.answer);

  return characters.map((char, index) => ({
    char,
    index,
    row: placement.row + direction.rowDelta * index,
    col: placement.col + direction.colDelta * index,
  }));
}

export function applyPlacement(board, term, placement) {
  const axisKey = placement.direction === "across" ? "acrossId" : "downId";

  for (const position of placementCells(term, placement)) {
    const index = cellIndex(board, position.row, position.col);
    const cell = board.cells[index] || {
      char: position.char,
      acrossId: null,
      downId: null,
    };

    cell.char = position.char;
    cell[axisKey] = term.id;
    board.cells[index] = cell;
  }

  return board;
}

export function occupiedBounds(board) {
  let minRow = board.height;
  let maxRow = -1;
  let minCol = board.width;
  let maxCol = -1;

  for (let row = 0; row < board.height; row += 1) {
    for (let col = 0; col < board.width; col += 1) {
      if (!isOccupied(board, row, col)) {
        continue;
      }

      minRow = Math.min(minRow, row);
      maxRow = Math.max(maxRow, row);
      minCol = Math.min(minCol, col);
      maxCol = Math.max(maxCol, col);
    }
  }

  if (maxRow === -1) {
    return null;
  }

  return { minRow, maxRow, minCol, maxCol };
}

export function cropBoard(board, placements) {
  const bounds = occupiedBounds(board);

  if (!bounds) {
    return {
      board: createBoard(0, 0),
      placements: [],
      offset: { row: 0, col: 0 },
    };
  }

  const width = bounds.maxCol - bounds.minCol + 1;
  const height = bounds.maxRow - bounds.minRow + 1;
  const cropped = createBoard(width, height);

  for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
    for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
      const cell = getCell(board, row, col);
      if (cell) {
        cropped.cells[cellIndex(cropped, row - bounds.minRow, col - bounds.minCol)] =
          { ...cell };
      }
    }
  }

  return {
    board: cropped,
    placements: placements.map((placement) => ({
      ...placement,
      row: placement.row - bounds.minRow,
      col: placement.col - bounds.minCol,
    })),
    offset: { row: bounds.minRow, col: bounds.minCol },
  };
}

export function boardRows(board) {
  return Array.from({ length: board.height }, (_, row) =>
    Array.from({ length: board.width }, (_, col) => getCell(board, row, col)),
  );
}
