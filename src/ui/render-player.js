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

function describeCell(player, row, col, startNumbers) {
  const key = row + ":" + col;
  return (
    row +
    1 +
    "行" +
    (col + 1) +
    "列" +
    (startNumbers.has(key) ? "、問題" + startNumbers.get(key) : "") +
    (player.getCellInput(row, col) ? "、入力済み" : "、未入力") +
    "。1回タップでヒントを表示、もう一度タップで入力します。"
  );
}

function applyBoardCellState(
  cellButton,
  player,
  row,
  col,
  activeKeys,
  activeCellKey,
  startNumbers,
  options,
) {
  const key = row + ":" + col;
  const preview = player.getCellPreview(row, col);
  const letter = player.getCellDisplayInput(row, col);
  const letterElement = cellButton.querySelector(".board-cell-letter");
  const boardCell = player.puzzle.board.cells[
    row * player.puzzle.board.width + col
  ];
  const showCorrectColors = options.preferences?.showCorrectColors !== false;
  const celebrate = (options.celebratedWordIds || []).some(
    (wordId) => boardCell?.acrossId === wordId || boardCell?.downId === wordId,
  );

  cellButton.classList.toggle("board-cell--active-word", activeKeys.has(key));
  cellButton.classList.toggle("board-cell--active", key === activeCellKey);
  cellButton.classList.toggle(
    "board-cell--confirmed",
    showCorrectColors && player.isCellLocked(key),
  );
  cellButton.classList.toggle("board-cell--celebrate", celebrate);
  cellButton.classList.toggle("board-cell--preview", Boolean(preview));
  cellButton.setAttribute("aria-pressed", String(key === activeCellKey));
  cellButton.setAttribute("aria-label", describeCell(player, row, col, startNumbers));
  letterElement.textContent = letter;
  letterElement.classList.toggle("board-cell-letter--preview", Boolean(preview));
}

function renderBoard(player, onCellTap, options) {
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
      cellButton.dataset.cellKey = key;
      if (cell.acrossId && cell.downId) {
        cellButton.classList.add("board-cell--crossing");
      }

      const number = startNumbers.get(key);
      if (number) {
        cellButton.append(element("span", "board-cell-number", String(number)));
      }

      cellButton.append(element("span", "board-cell-letter"));
      applyBoardCellState(
        cellButton,
        player,
        row,
        col,
        activeKeys,
        activeCellKey,
        startNumbers,
        options,
      );
      cellButton.addEventListener("click", () => onCellTap(row, col));
      boardElement.append(cellButton);
    }
  }

  boardElement.addEventListener("dblclick", (event) => event.preventDefault());

  return boardElement;
}

function renderClueList(player, direction, onWordSelect, options) {
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
      if (options.preferences?.showCorrectColors !== false) {
        button.classList.add("clue-button--correct");
      }
      button.append(element("span", "clue-complete-mark", " 正解"));
    }

    button.addEventListener("click", () => onWordSelect(word.id));
    item.append(button);
    list.append(item);
  }

  section.append(list);
  return section;
}

function renderDirectionButton(player, direction, onSelectDirection) {
  const word = player.getActiveWord();
  const button = element(
    "button",
    "direction-button",
    direction === "across" ? "ヨコ" : "タテ",
  );
  const availableDirections = player.getAvailableDirections();
  button.type = "button";
  button.disabled = !availableDirections.includes(direction);
  button.setAttribute("aria-pressed", String(word?.direction === direction));
  if (word?.direction === direction) {
    button.classList.add("direction-button--active");
  }
  button.addEventListener("click", () => onSelectDirection(direction));
  return button;
}

function renderCurrentClue(player, callbacks, options) {
  const word = player.getActiveWord();
  const progress = player.getProgress();
  const panel = element("section", "current-clue-panel");

  if (!word) {
    return panel;
  }

  panel.append(
    element("p", "current-clue-kicker", word.directionLabel + " " + word.number),
    element("h2", null, word.clue.text),
    element("p", "current-clue-category", word.category + " · " + word.clue.type),
  );

  const controls = element("div", "player-controls");
  const directionControl = element("div", "direction-switch");
  directionControl.setAttribute("role", "group");
  directionControl.setAttribute("aria-label", "単語の方向");
  directionControl.append(
    renderDirectionButton(player, "across", callbacks.onSelectDirection),
    renderDirectionButton(player, "down", callbacks.onSelectDirection),
  );

  const isInputMode = player.getMode() === "input";
  const inputButton = element(
    "button",
    isInputMode ? "secondary-button input-mode-button" : "primary-button input-mode-button",
    isInputMode ? "入力を終える" : "入力する",
  );
  inputButton.type = "button";
  inputButton.dataset.inputAction = isInputMode ? "end" : "start";
  inputButton.addEventListener("click", () => {
    if (isInputMode) {
      callbacks.onExitInputMode();
    } else {
      callbacks.onEnterInputMode();
    }
  });
  controls.append(directionControl, inputButton);
  panel.append(controls);

  panel.append(
    element(
      "p",
      "input-mode-message",
      isInputMode
        ? "入力中です。盤面をタップすると入力位置を移動できます。"
        : "マスを1回タップでヒント表示。選択中の単語をもう一度タップ、または「入力する」で入力します。",
    ),
  );

  const progressLabel = progress.correct + " / " + progress.total + " 問完成";
  const progressElement = document.createElement("progress");
  progressElement.className = "puzzle-progress";
  progressElement.value = progress.correct;
  progressElement.max = progress.total;
  progressElement.setAttribute("aria-label", progressLabel);
  panel.append(element("p", "progress-label", progressLabel), progressElement);

  return panel;
}

function renderPlayerSettings(options, onPreferencesChange) {
  const preferences = options.preferences || {};
  const panel = element("details", "player-settings");
  panel.append(element("summary", "player-settings-summary", "表示・音の設定"));
  const content = element("div", "player-settings-content");

  for (const setting of [
    {
      key: "showCorrectColors",
      label: "正解したマスを緑色にする",
      checked: preferences.showCorrectColors !== false,
    },
    {
      key: "soundEnabled",
      label: "正解時の効果音を鳴らす",
      checked: preferences.soundEnabled !== false,
    },
  ]) {
    const label = element("label", "toggle-setting");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = setting.checked;
    input.addEventListener("change", () =>
      onPreferencesChange({ [setting.key]: input.checked }),
    );
    label.append(input, element("span", null, setting.label));
    content.append(label);
  }

  panel.append(content);
  return panel;
}

export function renderPlayer(container, player, callbacks, options = {}) {
  container.replaceChildren();

  const boardSection = element("section", "board-section player-board-section");
  boardSection.append(
    element("h2", null, "クロスワードを解こう"),
    element("p", "board-meta", "ヒントを読んでから、選択中の単語をもう一度タップして入力します。交差マスの方向は、ヒント欄のヨコ／タテで選べます。"),
    renderBoard(player, callbacks.onCellTap, options),
  );

  const information = element("aside", "player-information");
  information.append(renderCurrentClue(player, callbacks, options));

  const resetButton = element("button", "text-button", "入力をリセット");
  resetButton.type = "button";
  resetButton.addEventListener("click", callbacks.onReset);
  information.append(
    resetButton,
    renderPlayerSettings(options, callbacks.onPreferencesChange),
  );

  const layout = element("div", "puzzle-layout puzzle-layout--player");
  layout.append(boardSection, information);
  container.append(layout);

  const cluePanel = element("details", "clue-panel");
  cluePanel.setAttribute("aria-label", "問題一覧");
  cluePanel.open = !window.matchMedia("(max-width: 700px)").matches;
  cluePanel.append(element("summary", "clue-panel-summary", "問題一覧"));
  const clueLayout = element("div", "clue-panel-content");
  clueLayout.append(
    renderClueList(player, "across", callbacks.onWordSelect, options),
    renderClueList(player, "down", callbacks.onWordSelect, options),
  );
  cluePanel.append(clueLayout);
  container.append(cluePanel);

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

/**
 * IME composition and one-character input happen frequently.  Replacing the
 * complete player tree there can disturb a mobile keyboard, so only board cell
 * content and selection styling are patched while the active clue is unchanged.
 */
export function patchPlayerBoard(container, player, preferences = {}) {
  const boardElement = container.querySelector(".crossword-board--player");
  if (!boardElement) {
    return false;
  }

  const activeKeys = activeWordCellKeys(player);
  const activeCellKey = player.getActiveCellKey();
  const startNumbers = wordStartNumbers(player);

  for (const cellButton of boardElement.querySelectorAll(
    ".board-cell--filled[data-row][data-col]",
  )) {
    const row = Number(cellButton.dataset.row);
    const col = Number(cellButton.dataset.col);
    applyBoardCellState(
      cellButton,
      player,
      row,
      col,
      activeKeys,
      activeCellKey,
      startNumbers,
      { preferences, celebratedWordIds: [] },
    );
  }

  return true;
}
