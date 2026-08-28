import { normalizeAnswerInput } from "../player/answer-normalizer.js";
import { validateDataset } from "../generator/validator.js";
import { enrichAliphaticDataset } from "../../data/aliphatic.js";

export const WORKBENCH_STORAGE_KEY = "organic-crossword:aliphatic:workbench-v1";
export const WORKBENCH_EXPORT_FORMAT = "organic-crossword-workbench-v1";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function defaultStorage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function normalizeClues(clues) {
  return (Array.isArray(clues) ? clues : []).map((clue) => ({
    level: Number(clue?.level),
    type: String(clue?.type || "").trim(),
    text: String(clue?.text || "").trim(),
  }));
}

function normalizeChanges(changes) {
  const next = { ...changes };

  if ("displayName" in next) {
    next.displayName = String(next.displayName || "").trim();
  }
  if ("answer" in next) {
    next.answer = normalizeAnswerInput(next.answer).join("");
    next.answerLength = Array.from(next.answer).length;
  }
  if ("category" in next) {
    next.category = String(next.category || "").trim();
  }
  if ("family" in next) {
    const family = String(next.family || "").trim();
    next.family = family || null;
  }
  if ("learningPriority" in next) {
    next.learningPriority = String(next.learningPriority || "").trim();
  }
  if ("crosswordPriority" in next) {
    next.crosswordPriority = String(next.crosswordPriority || "").trim();
  }
  if ("selectionWeight" in next) {
    next.selectionWeight = Number(next.selectionWeight);
  }
  if ("enabledByDefault" in next) {
    next.enabledByDefault = Boolean(next.enabledByDefault);
  }
  if ("note" in next) {
    next.note = String(next.note || "").trim();
  }
  if ("clues" in next) {
    next.clues = normalizeClues(next.clues);
  }

  return next;
}

function additionalErrors(dataset) {
  const errors = [];

  for (const entry of dataset.entries) {
    if (!Number.isInteger(entry.selectionWeight) || entry.selectionWeight < 1) {
      errors.push(entry.id + ": selectionWeight は1以上の整数です。");
    }
  }

  return errors;
}

export function validateWorkbenchDataset(dataset) {
  const validation = validateDataset(dataset);
  const errors = [...validation.errors, ...additionalErrors(dataset)];
  return { valid: errors.length === 0, errors };
}

export function parseWorkbenchExport(text) {
  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch {
    return { valid: false, errors: ["JSONとして読み込めませんでした。"] };
  }

  if (parsed?.format === WORKBENCH_EXPORT_FORMAT) {
    parsed = parsed.dataset;
  }

  try {
    parsed = enrichAliphaticDataset(parsed);
  } catch {
    return { valid: false, errors: ["脂肪族データの形式が不正です。"] };
  }

  const validation = validateWorkbenchDataset(parsed);
  if (!validation.valid) {
    return validation;
  }

  return { valid: true, dataset: clone(parsed), errors: [] };
}

export function createWorkbenchDraftStore(dataset, options = {}) {
  const storage = options.storage === undefined ? defaultStorage() : options.storage;
  const storageKey = options.storageKey || WORKBENCH_STORAGE_KEY;
  const initial = parseWorkbenchExport(JSON.stringify(dataset));

  if (!initial.valid) {
    throw new Error("教材データが不正です。\n" + initial.errors.join("\n"));
  }

  const original = initial.dataset;
  let draft = clone(original);

  try {
    const stored = storage?.getItem(storageKey);
    if (stored) {
      const restored = parseWorkbenchExport(stored);
      if (restored.valid) {
        draft = restored.dataset;
      }
    }
  } catch {
    // localStorageが利用できない場合も、ページ内の下書きは使える。
  }

  function persist() {
    try {
      storage?.setItem(
        storageKey,
        JSON.stringify({ format: WORKBENCH_EXPORT_FORMAT, dataset: draft }),
      );
    } catch {
      // 保存できないときも、現在開いているページでは編集を続けられる。
    }
  }

  function replace(nextDataset) {
    const checked = parseWorkbenchExport(JSON.stringify(nextDataset));
    if (!checked.valid) {
      return checked;
    }

    draft = checked.dataset;
    persist();
    return { valid: true, dataset: getDataset(), errors: [] };
  }

  function getDataset() {
    return clone(draft);
  }

  return {
    getDataset,

    getEntry(id) {
      const entry = draft.entries.find((candidate) => candidate.id === id);
      return entry ? clone(entry) : null;
    },

    updateEntry(id, changes) {
      const index = draft.entries.findIndex((entry) => entry.id === id);
      if (index < 0) {
        return { valid: false, errors: ["対象の用語が見つかりません。"] };
      }

      const candidate = clone(draft);
      candidate.entries[index] = {
        ...candidate.entries[index],
        ...normalizeChanges(changes),
      };
      return replace(candidate);
    },

    importText(text) {
      const parsed = parseWorkbenchExport(text);
      if (!parsed.valid) {
        return parsed;
      }
      return replace(parsed.dataset);
    },

    exportText() {
      return JSON.stringify(
        {
          format: WORKBENCH_EXPORT_FORMAT,
          dataset: draft,
        },
        null,
        2,
      );
    },

    reset() {
      draft = clone(original);
      try {
        storage?.removeItem(storageKey);
      } catch {
        // メモリ上の下書きは確実に初期値へ戻す。
      }
      return getDataset();
    },
  };
}
