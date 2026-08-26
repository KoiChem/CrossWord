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

function activeWordCellKeys(player) {
  return new Set(player.getActiveWord()?.cells.map((cell) => cell.key) || []);
}

function wordStartNumbers(player) {
  const numbers = new Map();

  for (const word of player.words) {
    const key = word.cells[0].key;
    const current = numbers.get(key);
    numbers.set(key, current ? Math.min(current, word.number) : word.number);
  }

  return numbers;
}

function renderBoard(player, onCellSelect) {
  const board = player.puzzle.board;
  const activeKeys = activeWordCellKeys(player);
  const activeCellKey = player.getActiveCellKey();
  const startNumbers = wordStartNumbers(player);
  const boardElement = element("div", "crossword-board crossword-board--player");
  boardElement.style.setProperty("--columns", String(board.width));
  boardElement.setAttribute(
    "aria-label",
    board.width + "列 " + board.height + "行のクロスワード盤面",
  );

  for (let row = 0; row < board.height; row += 1) {
    for (let col = 0; col < board.width; col += 1) {
      const cell = board.cells[row * board.width + col];
      if (!cell) {
        boardElement.append(element("div", "board-cell board-cell--void"));
        continue;
      }

      const key = row + ":" + col;
      const cellButton = element("button", "board-cell board-cell--filled");
      cellButton.type = "button";
      cellButton.dataset.row = String(row);
      cellButton.dataset.col = String(col);
      cellButton.setAttribute("aria-pressed", String(key === activeCellKey));
      cellButton.setAttribute(
        "aria-label",
        row +
          1 +
          "行" +
          (col + 1) +
          "列" +
          (startNumbers.has(key) ? "、問題" + startNumbers.get(key) : "") +
          (player.getCellInput(row, col) ? "、入力済み" : "、未入力"),
      );

      if (activeKeys.has(key)) {
        cellButton.classList.add("board-cell--active-word");
      }
      if (key === activeCellKey) {
        cellButton.classList.add("board-cell--active");
      }
      if (player.isCellLocked(key)) {
        cellButton.classList.add("board-cell--confirmed");
      }
      if (cell.acrossId && cell.downId) {
        cellButton.classList.add("board-cell--crossing");
      }

      const number = startNumbers.get(key);
      if (number) {
        cellButton.append(element("span", "board-cell-number", String(number)));
      }

      cellButton.append(
        element("span", "board-cell-letter", player.getCellInput(row, col)),
      );
      cellButton.addEventListener("click", () => onCellSelect(row, col));
      boardElement.append(cellButton);
    }
  }

  return boardElement;
}

function renderClueList(player, direction, onWordSelect) {
  const words = player.words.filter((word) => word.direction === direction);
  const section = element("section", "clue-list-section");
  section.append(element("h3", null, direction === "across" ? "ヨコ" : "タテ"));
  const list = element("ol", "clue-list");

  for (const word of words) {
    const item = element("li", "clue-list-item");
    const button = element(
      "button",
      "clue-button",
      word.number + ". " + word.clue.text,
    );
    button.type = "button";
    button.setAttribute("aria-pressed", String(player.getActiveWord()?.id === word.id));

    if (player.getActiveWord()?.id === word.id) {
      button.classList.add("clue-button--active");
    }
    if (player.isWordCorrect(word.id)) {
      button.classList.add("clue-button--correct");
      button.append(element("span", "clue-complete-mark", " 正解"));
    }

    button.addEventListener("click", () => onWordSelect(word.id));
    item.append(button);
    list.append(item);
  }

  section.append(list);
  return section;
}

function renderCurrentClue(player, onToggleDirection) {
  const word = player.getActiveWord();
  const progress = player.getProgress();
  const panel = element("section", "current-clue-panel");

  if (!word) {
    return panel;
  }

  const switchLabel = word.direction === "across" ? "タテに切替" : "ヨコに切替";
  const canSwitch = player.puzzle.board.cells.some((cell, index) => {
    if (!cell) {
      return false;
    }
    const row = Math.floor(index / player.puzzle.board.width);
    const col = index % player.puzzle.board.width;
    return (
      row + ":" + col === player.getActiveCellKey() &&
      cell.acrossId &&
      cell.downId
    );
  });

  panel.append(
    element("p", "current-clue-kicker", word.directionLabel + " " + word.number),
    element("h2", null, word.clue.text),
    element("p", "current-clue-category", word.category + " · " + word.clue.type),
  );

  const controls = element("div", "player-controls");
  const switchButton = element("button", "secondary-button", switchLabel);
  switchButton.type = "button";
  switchButton.disabled = !canSwitch;
  switchButton.addEventListener("click", onToggleDirection);
  controls.append(switchButton);
  panel.append(controls);

  const progressLabel = progress.correct + " / " + progress.total + " 問完成";
  const progressElement = document.createElement("progress");
  progressElement.className = "puzzle-progress";
  progressElement.value = progress.correct;
  progressElement.max = progress.total;
  progressElement.setAttribute("aria-label", progressLabel);
  panel.append(element("p", "progress-label", progressLabel), progressElement);

  return panel;
}

export function renderPlayer(container, player, callbacks) {
  container.replaceChildren();

  const boardSection = element("section", "board-section player-board-section");
  boardSection.append(
    element("h2", null, "クロスワードを解こう"),
    element("p", "board-meta", "マスをタップして入力。交差マスをもう一度タップするとタテ／ヨコを切り替えます。"),
    renderBoard(player, callbacks.onCellSelect),
  );

  const information = element("aside", "player-information");
  information.append(renderCurrentClue(player, callbacks.onToggleDirection));

  const resetButton = element("button", "text-button", "入力をリセット");
  resetButton.type = "button";
  resetButton.addEventListener("click", callbacks.onReset);
  information.append(resetButton);

  const layout = element("div", "puzzle-layout puzzle-layout--player");
  layout.append(boardSection, information);
  container.append(layout);

  const clueLayout = element("section", "clue-panel");
  clueLayout.setAttribute("aria-label", "問題一覧");
  clueLayout.append(
    renderClueList(player, "across", callbacks.onWordSelect),
    renderClueList(player, "down", callbacks.onWordSelect),
  );
  container.append(clueLayout);

  if (player.isComplete()) {
    const complete = element("section", "complete-panel");
    complete.setAttribute("aria-live", "polite");
    complete.append(
      element("p", "eyebrow", "COMPLETE"),
      element("h2", null, "全問正解！"),
      element("p", null, "次の盤面でも、有機化学のつながりを探してみよう。"),
    );
    container.append(complete);
  }
}
