import {
  getEnabledEntries,
  loadAliphaticDataset,
} from "../data/aliphatic.js";
import { getPuzzlePreset } from "./config/puzzle-presets.js";
import { generatePuzzle } from "./generator/generate-puzzle.js";
import { createRandomSeed } from "./generator/seeded-random.js";
import { validateDataset } from "./generator/validator.js";
import { renderGeneratorDebug } from "./ui/render-generator-debug.js";

const presetSelect = document.querySelector("#preset-select");
const seedInput = document.querySelector("#seed-input");
const generateButton = document.querySelector("#generate-button");
const newSeedButton = document.querySelector("#new-seed-button");
const statusMessage = document.querySelector("#status-message");
const puzzleOutput = document.querySelector("#puzzle-output");

let dataset;

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

function generateAndRender() {
  if (!dataset) {
    return;
  }

  try {
    generateButton.disabled = true;
    const config = getPuzzlePreset(presetSelect.value);
    const seed = ensureSeed();
    const puzzle = generatePuzzle({
      terms: getEnabledEntries(dataset),
      config,
      seed,
    });
    renderGeneratorDebug(puzzleOutput, puzzle, dataset);
    setStatus(
      config.label +
        "を生成しました。seed " +
        puzzle.debug.seed +
        " · " +
        puzzle.placements.length +
        "語",
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

initialize();
