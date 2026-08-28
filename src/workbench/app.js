import { loadAliphaticDataset } from "../../data/aliphatic.js";
import {
  createWorkbenchDraftStore,
} from "./draft-store.js";
import {
  getFilteredEntries,
  readEntryForm,
  renderWorkbenchEditor,
  renderWorkbenchList,
} from "./render-workbench.js";

const searchInput = document.querySelector("#workbench-search");
const categorySelect = document.querySelector("#workbench-category");
const prioritySelect = document.querySelector("#workbench-priority");
const enabledSelect = document.querySelector("#workbench-enabled");
const listOutput = document.querySelector("#workbench-list");
const editorOutput = document.querySelector("#workbench-editor");
const statusOutput = document.querySelector("#workbench-status");
const exportButton = document.querySelector("#workbench-export");
const importInput = document.querySelector("#workbench-import");
const resetButton = document.querySelector("#workbench-reset");
const controls = [
  searchInput,
  categorySelect,
  prioritySelect,
  enabledSelect,
  exportButton,
  importInput,
  resetButton,
];

let store;
let selectedId = null;

function setStatus(message, isError = false) {
  statusOutput.textContent = message;
  statusOutput.classList.toggle("workbench-status--error", isError);
}

function currentFilters() {
  return {
    query: searchInput.value,
    category: categorySelect.value,
    learningPriority: prioritySelect.value,
    enabled: enabledSelect.value,
  };
}

function ensureSelectedEntry(dataset) {
  if (!dataset.entries.some((entry) => entry.id === selectedId)) {
    selectedId = dataset.entries[0]?.id || null;
  }
}

function renderCategories(dataset) {
  const selected = categorySelect.value;
  const categories = [...new Set(dataset.entries.map((entry) => entry.category))].sort(
    (left, right) => left.localeCompare(right, "ja"),
  );
  categorySelect.replaceChildren(new Option("すべての分類", ""));
  for (const category of categories) {
    categorySelect.append(new Option(category, category));
  }
  categorySelect.value = categories.includes(selected) ? selected : "";
}

function render() {
  const dataset = store.getDataset();
  ensureSelectedEntry(dataset);
  renderCategories(dataset);
  const visibleEntries = getFilteredEntries(dataset, currentFilters());
  if (!visibleEntries.some((entry) => entry.id === selectedId)) {
    selectedId = visibleEntries[0]?.id || null;
  }
  renderWorkbenchList(
    listOutput,
    dataset,
    selectedId,
    currentFilters(),
    (id) => {
      selectedId = id;
      render();
    },
  );
  renderWorkbenchEditor(
    editorOutput,
    store.getEntry(selectedId),
    (form, entry) => {
      const result = store.updateEntry(entry.id, readEntryForm(form, entry));
      if (!result.valid) {
        setStatus(result.errors.join("\n"), true);
        return;
      }

      setStatus("保存しました。下書きはこの端末に保存され、書き出しもできます。");
      render();
    },
  );
}

function downloadDraft() {
  const blob = new Blob([store.exportText()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "crossword-aliphatic-review.json";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  setStatus("下書きJSONを書き出しました。このファイルを添付すれば教材データへ反映できます。");
}

async function importDraft(file) {
  if (!file) {
    return;
  }

  const result = store.importText(await file.text());
  if (!result.valid) {
    setStatus(result.errors.join("\n"), true);
    return;
  }

  selectedId = result.dataset.entries[0]?.id || null;
  importInput.value = "";
  setStatus("下書きJSONを読み込みました。内容を確認してから必要に応じて書き出してください。");
  render();
}

async function initialize() {
  try {
    const dataset = await loadAliphaticDataset();
    store = createWorkbenchDraftStore(dataset);
    for (const control of controls) {
      control.disabled = false;
    }
    render();
    setStatus("100語を読み込みました。修正はこの端末の下書きにだけ保存されます。");
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "教材データを読み込めませんでした。",
      true,
    );
  }
}

for (const control of [searchInput, categorySelect, prioritySelect, enabledSelect]) {
  control.addEventListener("input", render);
  control.addEventListener("change", render);
}

exportButton.addEventListener("click", downloadDraft);
importInput.addEventListener("change", () => importDraft(importInput.files?.[0]));
resetButton.addEventListener("click", () => {
  store.reset();
  selectedId = null;
  setStatus("下書きを初期状態へ戻しました。");
  render();
});

initialize();
