import assert from "node:assert/strict";
import test from "node:test";

import {
  createWorkbenchDraftStore,
  parseWorkbenchExport,
  WORKBENCH_EXPORT_FORMAT,
} from "../../src/workbench/draft-store.js";
import { getFilteredEntries } from "../../src/workbench/render-workbench.js";

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) || null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

function entry(id, displayName, answer) {
  return {
    id,
    displayName,
    answer,
    answerLength: Array.from(answer).length,
    category: "アルコール",
    family: "alcohol_name",
    enabledByDefault: true,
    aliases: [],
    clues: [{ level: 1, type: "definition", text: displayName + "のヒント" }],
    sourceKeys: ["mext"],
    note: "",
    learningPriority: "A",
    crosswordPriority: "A",
    selectionWeight: 3,
  };
}

function dataset() {
  return {
    meta: { version: "test" },
    entries: [entry("ethanol", "エタノール", "えたのーる"), entry("methanol", "メタノール", "めたのーる")],
  };
}

test("編集時に答えをひらがなへ正規化し、下書きへ保存する", () => {
  const storage = createStorage();
  const store = createWorkbenchDraftStore(dataset(), { storage });
  const result = store.updateEntry("ethanol", { answer: "エタノール" });

  assert.equal(result.valid, true);
  assert.equal(store.getEntry("ethanol").answer, "えたのーる");
  assert.equal(store.getEntry("ethanol").answerLength, 5);
  assert.match(storage.getItem("organic-crossword:aliphatic:workbench-v1"), /workbench-v1/);
});

test("重複する答えや不正な下書きは保存しない", () => {
  const store = createWorkbenchDraftStore(dataset(), { storage: createStorage() });
  const result = store.updateEntry("methanol", { answer: "えたのーる" });

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /canonical answer が重複/);
  assert.equal(store.getEntry("methanol").answer, "めたのーる");
});

test("書き出し形式を読み込み、元データの補助ヒントも維持する", () => {
  const store = createWorkbenchDraftStore(dataset(), { storage: createStorage() });
  const exported = JSON.parse(store.exportText());
  const parsed = parseWorkbenchExport(JSON.stringify(exported));

  assert.equal(exported.format, WORKBENCH_EXPORT_FORMAT);
  assert.equal(parsed.valid, true);
  assert.ok(parsed.dataset.entries.find((candidate) => candidate.id === "ethanol").clues.length >= 2);
});

test("検索結果は名称・答え・分類から絞り込める", () => {
  const entries = getFilteredEntries(dataset(), {
    query: "エタノール",
    category: "",
    learningPriority: "",
    enabled: "",
  });

  assert.deepEqual(entries.map((candidate) => candidate.id), ["ethanol"]);
});
