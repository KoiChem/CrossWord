function element(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

function metricText(label, value) {
  return element("li", "metric-item", label + " " + value);
}

function renderBoard(board) {
  const boardElement = element("div", "crossword-board");
  boardElement.style.setProperty("--columns", String(board.width));
  boardElement.setAttribute(
    "aria-label",
    board.width + "列 " + board.height + "行のクロスワード盤面",
  );

  for (const cell of board.cells) {
    const square = element(
      "div",
      cell ? "board-cell board-cell--filled" : "board-cell",
      cell ? cell.char : "",
    );

    if (cell && cell.acrossId && cell.downId) {
      square.classList.add("board-cell--crossing");
    }

    boardElement.append(square);
  }

  return boardElement;
}

function renderTerms(puzzle, termById) {
  const list = element("ol", "term-list");

  for (const placement of puzzle.placements) {
    const term = termById.get(placement.wordId);
    const item = element("li", "term-item");
    const title = element("strong", null, term.displayName);
    const detail = element(
      "span",
      null,
      "（" + term.answer + "・" + term.category + "・" + (term.family || "familyなし") + "）",
    );
    item.append(title, detail);
    list.append(item);
  }

  return list;
}

export function renderGeneratorDebug(container, puzzle, dataset) {
  container.replaceChildren();

  const termById = new Map(dataset.entries.map((term) => [term.id, term]));
  const boardSection = element("section", "board-section");
  const boardHeading = element("h2", null, "生成された盤面");
  const boardMeta = element(
    "p",
    "board-meta",
    puzzle.board.width +
      "×" +
      puzzle.board.height +
      "表示 · " +
      puzzle.placements.length +
      "語 · " +
      puzzle.quality.metrics.crossingCount +
      "交差",
  );
  boardSection.append(boardHeading, boardMeta, renderBoard(puzzle.board));

  const information = element("aside", "generator-information");
  const qualityHeading = element("h2", null, "品質指標");
  const metrics = element("ul", "metric-list");
  const quality = puzzle.quality.metrics;
  metrics.append(
    metricText("総合", puzzle.quality.score.toFixed(1)),
    metricText("目標語数達成", (quality.wordCoverage * 100).toFixed(0) + "%"),
    metricText("交差", String(quality.crossingCount)),
    metricText("compactness", quality.compactness.toFixed(2)),
    metricText("family重複ペナルティ", String(quality.familyPenalty)),
    metricText("seed", String(puzzle.debug.seed)),
    metricText("探索ノード", String(puzzle.debug.nodeCount)),
    metricText("停止理由", puzzle.debug.stopReason),
  );

  const termsHeading = element("h2", null, "今回の出題語（Phase 1確認用）");
  information.append(qualityHeading, metrics, termsHeading, renderTerms(puzzle, termById));

  const layout = element("div", "puzzle-layout");
  layout.append(boardSection, information);
  container.append(layout);
}
