import { buildWordGraph, countFamilies } from "./validator.js";

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function characterFrequency(terms) {
  const frequency = new Map();
  let total = 0;

  for (const term of terms) {
    for (const char of Array.from(term.answer)) {
      frequency.set(char, (frequency.get(char) || 0) + 1);
      total += 1;
    }
  }

  return { frequency, total };
}

function intersectionQuality(board, terms) {
  const { frequency, total } = characterFrequency(terms);
  const vocabulary = frequency.size || 1;
  const values = [];

  for (const cell of board.cells) {
    if (!cell || !cell.acrossId || !cell.downId) {
      continue;
    }

    const probability = ((frequency.get(cell.char) || 0) + 1) / (total + vocabulary);
    const information = -Math.log2(probability);
    const normalized = clamp01(information / 6);
    values.push(cell.char === "ー" ? normalized * 0.25 : normalized);
  }

  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function spatialBalance(board) {
  const occupied = [];

  for (let row = 0; row < board.height; row += 1) {
    for (let col = 0; col < board.width; col += 1) {
      const cell = board.cells[row * board.width + col];
      if (cell) {
        occupied.push({ row, col });
      }
    }
  }

  if (occupied.length === 0) {
    return 0;
  }

  const centroid = occupied.reduce(
    (sum, point) => ({
      row: sum.row + point.row,
      col: sum.col + point.col,
    }),
    { row: 0, col: 0 },
  );
  centroid.row /= occupied.length;
  centroid.col /= occupied.length;

  const centerRow = (board.height - 1) / 2;
  const centerCol = (board.width - 1) / 2;
  const maxDistance = Math.hypot(Math.max(centerRow, 0.5), Math.max(centerCol, 0.5));
  const distance = Math.hypot(centroid.row - centerRow, centroid.col - centerCol);
  return clamp01(1 - distance / maxDistance);
}

function semanticCoherence(placedTerms) {
  if (placedTerms.length < 2) {
    return 0;
  }

  let pairs = 0;
  let relatedPairs = 0;

  for (let left = 0; left < placedTerms.length; left += 1) {
    for (let right = left + 1; right < placedTerms.length; right += 1) {
      pairs += 1;
      if (placedTerms[left].category === placedTerms[right].category) {
        relatedPairs += 1;
      }
    }
  }

  return pairs === 0 ? 0 : relatedPairs / pairs;
}

export function scorePuzzle(puzzle, termById, corpusTerms, config) {
  const placedTerms = puzzle.placements
    .map((placement) => termById.get(placement.wordId))
    .filter(Boolean);
  const occupiedCells = puzzle.board.cells.filter(Boolean).length;
  const crossingCount = puzzle.board.cells.filter(
    (cell) => cell && cell.acrossId && cell.downId,
  ).length;
  const graph = buildWordGraph(puzzle.board, puzzle.placements);
  const degrees = [...graph.values()].map((neighbors) => neighbors.size);
  const acrossCount = puzzle.placements.filter(
    (placement) => placement.direction === "across",
  ).length;
  const downCount = puzzle.placements.length - acrossCount;
  const compactness = occupiedCells / Math.max(1, puzzle.board.width * puzzle.board.height);
  const compactnessQuality = clamp01(1 - Math.abs(compactness - 0.48) / 0.48);
  const maxDegree = degrees.length === 0 ? 0 : Math.max(...degrees);
  const degreeBalance =
    placedTerms.length <= 2
      ? 1
      : clamp01(1 - Math.max(0, maxDegree - 3) / Math.max(1, placedTerms.length - 3));
  const familyCounts = countFamilies(placedTerms);
  const familyPenalty = [...familyCounts.values()].reduce(
    (sum, count) => sum + Math.max(0, count - config.softFamilyCount),
    0,
  );
  const minimumConnectedCrossings = Math.max(0, placedTerms.length - 1);
  const extraCrossingCount = Math.max(0, crossingCount - minimumConnectedCrossings);
  const targetExtraCrossings = Math.max(0, config.targetExtraCrossings || 0);
  const metrics = {
    wordCoverage: clamp01(placedTerms.length / config.targetWords),
    crossingQuality: clamp01(crossingCount / Math.max(1, placedTerms.length)),
    compactness,
    compactnessQuality,
    spatialBalance: spatialBalance(puzzle.board),
    orientationBalance:
      placedTerms.length === 0
        ? 0
        : clamp01(1 - Math.abs(acrossCount - downCount) / placedTerms.length),
    degreeBalance,
    semanticCoherence: semanticCoherence(placedTerms),
    intersectionQuality: intersectionQuality(puzzle.board, corpusTerms),
    familyPenalty,
    placedWordCount: placedTerms.length,
    crossingCount,
    minimumConnectedCrossings,
    extraCrossingCount,
    extraCrossingTarget: targetExtraCrossings,
    extraCrossingTargetMet:
      targetExtraCrossings === 0 || extraCrossingCount >= targetExtraCrossings,
    extraCrossingQuality:
      targetExtraCrossings === 0
        ? 1
        : clamp01(extraCrossingCount / targetExtraCrossings),
    occupiedCells,
    maxDegree,
    acrossCount,
    downCount,
  };

  const score =
    35 * metrics.wordCoverage +
    14 * metrics.crossingQuality +
    16 * metrics.extraCrossingQuality +
    12 * metrics.compactnessQuality +
    10 * metrics.spatialBalance +
    8 * metrics.orientationBalance +
    6 * metrics.degreeBalance +
    5 * metrics.semanticCoherence +
    4 * metrics.intersectionQuality -
    8 * metrics.familyPenalty;

  return {
    score,
    metrics,
  };
}
