import {
  getEnabledEntries,
  loadAliphaticDataset,
} from "../data/aliphatic.js";
import { getPuzzlePreset } from "./config/puzzle-presets.js";
import { generatePuzzle } from "./generator/generate-puzzle.js";
import { createRandomSeed } from "./generator/seeded-random.js";
import { validateDataset } from "./generator/validator.js";
import { createRecentTermHistory } from "./history/recent-term-history.js";
import { createImeInputController } from "./player/input-controller.js";
import { createPuzzleState } from "./player/puzzle-state.js";
import { createTapController } from "./player/tap-controller.js";
import { patchPlayerBoard, renderPlayer } from "./ui/render-player.js";

const presetSelect = document.querySelector("#preset-select");
const seedInput = document.querySelector("#seed-input");
const generateButton = document.querySelector("#generate-button");
const newSeedButton = document.querySelector("#new-seed-button");
const statusMessage = document.querySelector("#status-message");
const puzzleOutput = document.querySelector("#puzzle-output");
const imeInput = document.querySelector("#ime-input");

let dataset;
let player;
let imeController;
let recentTermHistory;
let lastGenerationRequestKey = null;
let lastSelectionWeights = null;
const tapController = createTapController();
let viewportRevealFrame = null;

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("status-message--error", isError);
}

function ensureSeed() {
  const seed = seedInput.value.trim();
  if (seed) {
    return seed;
  }

  const generated = String(createRandomSeed());
  seedInput.value = generated;
  return generated;
}

function currentGenerationRequestKey(config, seed) {
  return config.id + ":" + String(seed);
}

function generationHistoryKey(puzzle, config) {
  return [
    dataset.meta?.version || "data",
    config.id,
    puzzle.debug.seed,
    puzzle.debug.fingerprint,
  ].join(":");
}

function renderPlayerState(options = {}) {
  if (!player) {
    return;
  }

  if (options.patchBoard && patchPlayerBoard(puzzleOutput, player)) {
    return;
  }

  renderPlayer(puzzleOutput, player, {
    onCellTap(row, col) {
      const selection = player.selectCell(row, col);
      const isDoubleTap =
        player.getMode() !== "input" &&
        tapController.register(player.getActiveWord()?.id);
      const inputMode = isDoubleTap ? player.enterInputMode() : null;
      const changed = selection.changed || inputMode?.changed;

      if (!changed) {
        return;
      }

      updatePlayer(
        {
          changed,
          newlyCorrectWordIds: [],
          completed: player.isComplete(),
        },
        player.getMode() === "input",
      );
    },
    onWordSelect(wordId) {
      tapController.reset();
      updatePlayer(
        player.selectWord(wordId, { firstOpenCell: true }),
        player.getMode() === "input",
      );
    },
    onSelectDirection(direction) {
      tapController.reset();
      updatePlayer(
        player.selectDirection(direction),
        player.getMode() === "input",
      );
    },
    onEnterInputMode() {
      tapController.reset();
      updatePlayer(player.enterInputMode(), true);
    },
    onExitInputMode() {
      tapController.reset();
      imeController.blur();
      updatePlayer(player.exitInputMode());
    },
    onReset() {
      tapController.reset();
      imeController.blur();
      updatePlayer(player.reset(), false, "入力をリセットしました。");
    },
  });
}

function revealActiveInputContext() {
  if (viewportRevealFrame) {
    cancelAnimationFrame(viewportRevealFrame);
  }

  viewportRevealFrame = requestAnimationFrame(() => {
    viewportRevealFrame = null;
    puzzleOutput
      .querySelector(".board-cell--active")
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
}

function updatePlayer(result, focusInput = false, message = "", options = {}) {
  if (!result.changed && result.newlyCorrectWordIds.length === 0) {
    return;
  }

  renderPlayerState({ patchBoard: options.patchBoard });
  const progress = player.getProgress();
  const newlyCorrectNames = result.newlyCorrectWordIds
    .map((wordId) => dataset.entries.find((term) => term.id === wordId)?.displayName)
    .filter(Boolean);

  if (result.completed) {
    setStatus("COMPLETE！ " + progress.total + "問すべて正解です。");
  } else if (newlyCorrectNames.length > 0) {
    setStatus(newlyCorrectNames.join("・") + " が正解！ " + progress.correct + " / " + progress.total + "問完成");
  } else if (message) {
    setStatus(message);
  }

  if (focusInput) {
    imeController.focus();
    revealActiveInputContext();
  }
}

function generateAndRender() {
  if (!dataset) {
    return;
  }

  try {
    generateButton.disabled = true;
    const config = getPuzzlePreset(presetSelect.value);
    const seed = ensureSeed();
    const requestKey = currentGenerationRequestKey(config, seed);
    const selectionWeights =
      requestKey === lastGenerationRequestKey
        ? lastSelectionWeights
        : recentTermHistory.getWeights();
    const recentPuzzleCount = recentTermHistory.getPuzzles().length;
    const puzzle = generatePuzzle({
      terms: getEnabledEntries(dataset),
      config,
      seed,
      selectionWeights,
    });
    player = createPuzzleState(puzzle, dataset.entries);
    tapController.reset();
    lastGenerationRequestKey = requestKey;
    lastSelectionWeights = selectionWeights;
    const suppressedTermCount = Object.keys(selectionWeights).length;
    recentTermHistory.recordPuzzle(
      puzzle.selectedTermIds,
      generationHistoryKey(puzzle, config),
    );
    renderPlayerState();
    setStatus(
      config.label +
        "を生成しました。seed " +
        puzzle.debug.seed +
        " · " +
        puzzle.placements.length +
        "語" +
        (suppressedTermCount > 0
          ?
            " · 直近" +
            recentPuzzleCount +
            "盤面の" +
            suppressedTermCount +
            "語を出にくくしています"
          : ""),
    );
  } catch (error) {
    puzzleOutput.replaceChildren();
    setStatus(
      error instanceof Error ? error.message : "盤面の生成に失敗しました。",
      true,
    );
  } finally {
    generateButton.disabled = false;
  }
}

async function initialize() {
  try {
    dataset = await loadAliphaticDataset();
    const validation = validateDataset(dataset);

    if (!validation.valid) {
      throw new Error(validation.errors.join("\n"));
    }

    recentTermHistory = createRecentTermHistory();
    imeController = createImeInputController(imeInput, {
      onCharacters(characters) {
        if (player?.getMode() !== "input") {
          return;
        }

        const result = player.enterCharacters(characters);
        updatePlayer(result, true, "", {
          patchBoard:
            result.newlyCorrectWordIds.length === 0 && !result.completed,
        });
      },
      onCompositionPreview(characters) {
        if (player?.getMode() !== "input") {
          return;
        }

        updatePlayer(player.setCompositionPreview(characters), true, "", {
          patchBoard: true,
        });
      },
      onBackspace() {
        if (player?.getMode() !== "input") {
          return;
        }

        updatePlayer(player.backspace(), true, "", { patchBoard: true });
      },
      onMove(delta) {
        if (player?.getMode() !== "input") {
          return;
        }

        updatePlayer(player.move(delta), true, "", { patchBoard: true });
      },
      onToggleDirection() {
        if (player?.getMode() !== "input") {
          return;
        }

        tapController.reset();
        updatePlayer(player.toggleDirection(), true);
      },
    });
    seedInput.value = String(createRandomSeed());
    generateAndRender();
  } catch (error) {
    setStatus(
      error instanceof Error
        ? "教材データの読み込みに失敗しました: " + error.message
        : "教材データの読み込みに失敗しました。",
      true,
    );
  }
}

generateButton.addEventListener("click", generateAndRender);
newSeedButton.addEventListener("click", () => {
  seedInput.value = String(createRandomSeed());
  generateAndRender();
});

window.visualViewport?.addEventListener("resize", () => {
  if (player?.getMode() === "input") {
    revealActiveInputContext();
  }
});

initialize();
