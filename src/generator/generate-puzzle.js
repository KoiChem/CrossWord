import {
  DIRECTIONS,
  applyPlacement,
  cloneBoard,
  createBoard,
  cropBoard,
  occupiedBounds,
  oppositeDirection,
  placementCells,
} from "./board.js";
import { createCrossingIndex, crossingDegree, getCrossings } from "./crossing-index.js";
import { createRandomSeed, hashText, SeededRandom } from "./seeded-random.js";
import { scorePuzzle } from "./scorer.js";
import { selectCandidatePool } from "./select-words.js";
import {
  assertValidDataset,
  canPlaceTerm,
  countFamilies,
  validateGeneratedPuzzle,
} from "./validator.js";

function familyKey(term) {
  return term.family || null;
}

function hasFamilyCapacity(term, familyCounts, config) {
  const family = familyKey(term);
  return !family || (familyCounts.get(family) || 0) < config.maxFamilyCount;
}

function nextFamilyCounts(familyCounts, term) {
  const result = new Map(familyCounts);
  const family = familyKey(term);
  if (family) {
    result.set(family, (result.get(family) || 0) + 1);
  }
  return result;
}

function placementKey(placement) {
  return [placement.row, placement.col, placement.direction].join(":");
}

function projectedArea(board, term, placement) {
  const existing = occupiedBounds(board);
  const positions = placementCells(term, placement);
  let minRow = existing ? existing.minRow : positions[0].row;
  let maxRow = existing ? existing.maxRow : positions[0].row;
  let minCol = existing ? existing.minCol : positions[0].col;
  let maxCol = existing ? existing.maxCol : positions[0].col;

  for (const position of positions) {
    minRow = Math.min(minRow, position.row);
    maxRow = Math.max(maxRow, position.row);
    minCol = Math.min(minCol, position.col);
    maxCol = Math.max(maxCol, position.col);
  }

  return (maxRow - minRow + 1) * (maxCol - minCol + 1);
}

function enumeratePlacementCandidates(
  board,
  placements,
  term,
  crossingIndex,
  config,
  random,
) {
  const candidatesByKey = new Map();

  for (const placed of placements) {
    const crossings = getCrossings(crossingIndex, term.id, placed.wordId);
    const direction = oppositeDirection(placed.direction);
    const newDirection = DIRECTIONS[direction];
    const placedDirection = DIRECTIONS[placed.direction];

    for (const crossing of crossings) {
      const crossingRow =
        placed.row + placedDirection.rowDelta * crossing.secondIndex;
      const crossingCol =
        placed.col + placedDirection.colDelta * crossing.secondIndex;
      const placement = {
        row: crossingRow - newDirection.rowDelta * crossing.firstIndex,
        col: crossingCol - newDirection.colDelta * crossing.firstIndex,
        direction,
      };
      const key = placementKey(placement);

      if (candidatesByKey.has(key)) {
        continue;
      }

      const result = canPlaceTerm(board, term, placement, {
        requireCrossing: true,
      });

      if (!result.valid) {
        continue;
      }

      candidatesByKey.set(key, {
        ...placement,
        crossings: result.crossings,
        projectedArea: projectedArea(board, term, placement),
        tieBreak: random.next(),
      });
    }
  }

  return [...candidatesByKey.values()]
    .sort((left, right) => {
      if (right.crossings.length !== left.crossings.length) {
        return right.crossings.length - left.crossings.length;
      }
      if (left.projectedArea !== right.projectedArea) {
        return left.projectedArea - right.projectedArea;
      }
      return left.tieBreak - right.tieBreak;
    })
    .slice(0, config.maxCandidatesPerWord);
}

function anchorPlacements(board, term, random) {
  const candidates = [];
  const length = Array.from(term.answer).length;
  const offsets = [-1, 0, 1];

  for (const direction of ["across", "down"]) {
    const directionSpec = DIRECTIONS[direction];
    const startRow =
      direction === "across"
        ? Math.floor((board.height - 1) / 2)
        : Math.floor((board.height - length) / 2);
    const startCol =
      direction === "across"
        ? Math.floor((board.width - length) / 2)
        : Math.floor((board.width - 1) / 2);

    for (const offset of offsets) {
      const placement = {
        row: startRow + (directionSpec.rowDelta === 0 ? offset : 0),
        col: startCol + (directionSpec.colDelta === 0 ? offset : 0),
        direction,
      };

      if (
        placement.row < 0 ||
        placement.col < 0 ||
        placement.row + directionSpec.rowDelta * (length - 1) >= board.height ||
        placement.col + directionSpec.colDelta * (length - 1) >= board.width
      ) {
        continue;
      }

      candidates.push(placement);
    }
  }

  return random.shuffle(candidates);
}

function getSearchGroups(state, context) {
  const groups = [];

  for (const term of state.remaining) {
    if (!hasFamilyCapacity(term, state.familyCounts, context.config)) {
      continue;
    }

    const candidates = enumeratePlacementCandidates(
      state.board,
      state.placements,
      term,
      context.crossingIndex,
      context.config,
      context.random,
    );

    if (candidates.length > 0) {
      groups.push({
        term,
        candidates,
        degree: crossingDegree(context.crossingIndex, term.id),
        tieBreak: context.random.next(),
      });
    }
  }

  return groups
    .sort((left, right) => {
      if (left.candidates.length !== right.candidates.length) {
        return left.candidates.length - right.candidates.length;
      }
      if (right.degree !== left.degree) {
        return right.degree - left.degree;
      }
      return left.tieBreak - right.tieBreak;
    })
    .slice(0, context.config.maxWordGroupsPerDepth);
}

function puzzleFingerprint(placements) {
  const text = placements
    .map((placement) =>
      [
        placement.wordId,
        placement.row,
        placement.col,
        placement.direction,
      ].join(":"),
    )
    .sort()
    .join("|");

  return hashText(text).toString(16).padStart(8, "0");
}

function retainCandidate(context, state) {
  if (state.placements.length < context.config.minWords) {
    return;
  }

  const cropped = cropBoard(state.board, state.placements);
  const fingerprint = puzzleFingerprint(cropped.placements);

  if (context.seenFingerprints.has(fingerprint)) {
    return;
  }
  context.seenFingerprints.add(fingerprint);

  const puzzle = {
    board: cropped.board,
    placements: cropped.placements.map((placement) => ({
      wordId: placement.wordId,
      row: placement.row,
      col: placement.col,
      direction: placement.direction,
    })),
    selectedTermIds: cropped.placements.map((placement) => placement.wordId),
  };
  const quality = scorePuzzle(
    puzzle,
    context.termById,
    context.eligibleTerms,
    context.config,
  );

  context.candidates.push({
    puzzle,
    quality,
    fingerprint,
  });
  context.candidates.sort((left, right) => right.quality.score - left.quality.score);
  context.candidates.length = Math.min(
    context.candidates.length,
    context.config.retainedCandidates,
  );
}

function hasEnoughTargetCandidates(context) {
  return (
    context.candidates.filter(
      (candidate) =>
        candidate.quality.metrics.placedWordCount >= context.config.targetWords,
    ).length >= context.config.retainedCandidates
  );
}

function search(state, context) {
  if (context.nodeCount >= context.config.maxTotalNodes) {
    context.stopReason = "node-limit";
    return;
  }

  context.nodeCount += 1;

  if (state.placements.length >= context.config.minWords) {
    retainCandidate(context, state);
  }

  if (hasEnoughTargetCandidates(context)) {
    context.stopReason = "target-candidates";
    return;
  }

  if (
    state.placements.length >= context.config.targetWords ||
    state.placements.length >= context.config.maxWords
  ) {
    return;
  }

  const groups = getSearchGroups(state, context);

  for (const group of groups) {
    for (const candidate of group.candidates) {
      if (context.nodeCount >= context.config.maxTotalNodes) {
        context.stopReason = "node-limit";
        return;
      }

      const board = cloneBoard(state.board);
      applyPlacement(board, group.term, candidate);
      const placement = {
        wordId: group.term.id,
        row: candidate.row,
        col: candidate.col,
        direction: candidate.direction,
      };
      const nextState = {
        board,
        placements: [...state.placements, placement],
        remaining: state.remaining.filter((term) => term.id !== group.term.id),
        familyCounts: nextFamilyCounts(state.familyCounts, group.term),
      };

      search(nextState, context);
    }
  }
}

function generateFromPool(pool, context) {
  const anchor = pool[0];

  for (let restart = 0; restart < context.config.maxRestarts; restart += 1) {
    if (context.nodeCount >= context.config.maxTotalNodes) {
      context.stopReason = "node-limit";
      return;
    }

    const board = createBoard(context.config.width, context.config.height);
    const placements = anchorPlacements(board, anchor, context.random);
    const anchorPlacement = placements[0];

    if (!anchorPlacement) {
      continue;
    }

    const anchorResult = canPlaceTerm(board, anchor, anchorPlacement, {
      requireCrossing: false,
    });
    if (!anchorResult.valid) {
      continue;
    }

    applyPlacement(board, anchor, anchorPlacement);
    context.restartCount += 1;
    search(
      {
        board,
        placements: [
          {
            wordId: anchor.id,
            row: anchorPlacement.row,
            col: anchorPlacement.col,
            direction: anchorPlacement.direction,
          },
        ],
        remaining: pool.filter((term) => term.id !== anchor.id),
        familyCounts: countFamilies([anchor]),
      },
      context,
    );

    if (hasEnoughTargetCandidates(context)) {
      return;
    }
  }
}

function recencyFingerprint(selectionWeights) {
  return hashText(
    Object.entries(selectionWeights || {})
      .filter(([, value]) => Number(value) !== 1)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([id, value]) => id + ":" + String(value))
      .join("|"),
  )
    .toString(16)
    .padStart(8, "0");
}

export function generatePuzzle({
  terms,
  config,
  seed = createRandomSeed(),
  selectionWeights = null,
}) {
  assertValidDataset({ entries: terms });

  const random = new SeededRandom(seed);
  const crossingIndex = createCrossingIndex(terms);
  const eligibleTerms = terms.filter((term) => {
    const length = Array.from(term.answer).length;
    return (
      term.enabledByDefault !== false &&
      length >= 3 &&
      length <= Math.min(config.width, config.height)
    );
  });
  const context = {
    config,
    random,
    crossingIndex,
    eligibleTerms,
    termById: new Map(terms.map((term) => [term.id, term])),
    nodeCount: 0,
    restartCount: 0,
    stopReason: "completed",
    candidates: [],
    seenFingerprints: new Set(),
  };

  for (let poolAttempt = 0; poolAttempt < config.poolAttempts; poolAttempt += 1) {
    if (context.nodeCount >= config.maxTotalNodes) {
      context.stopReason = "node-limit";
      break;
    }

    const pool = selectCandidatePool(
      terms,
      config,
      crossingIndex,
      random,
      selectionWeights,
    );
    generateFromPool(pool, context);

    if (hasEnoughTargetCandidates(context)) {
      break;
    }
  }

  const best = context.candidates[0];

  if (!best) {
    throw new Error(
      "盤面を生成できませんでした。seed=" +
        String(seed) +
        " nodes=" +
        String(context.nodeCount),
    );
  }

  const result = {
    ...best.puzzle,
    quality: best.quality,
    debug: {
      seed: random.seed,
      fingerprint: best.fingerprint,
      nodeCount: context.nodeCount,
      restartCount: context.restartCount,
      stopReason: context.stopReason,
      generatorVersion: "phase2-v1",
      recencyFingerprint: recencyFingerprint(selectionWeights),
    },
  };
  const validation = validateGeneratedPuzzle(result, terms, config);

  if (!validation.valid) {
    throw new Error(
      "Generatorが不正な盤面を返しました。\n" + validation.errors.join("\n"),
    );
  }

  return result;
}
