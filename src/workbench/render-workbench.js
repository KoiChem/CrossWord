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

function option(value, label, selected) {
  const item = element("option", null, label);
  item.value = value;
  item.selected = selected;
  return item;
}

function field(labelText, control) {
  const label = element("label", "workbench-field");
  label.append(element("span", "workbench-field-label", labelText), control);
  return label;
}

function textInput(name, value) {
  const input = document.createElement("input");
  input.name = name;
  input.value = value || "";
  input.autocomplete = "off";
  return input;
}

function selectInput(name, value, values) {
  const select = document.createElement("select");
  select.name = name;
  for (const item of values) {
    select.append(option(item, item, item === value));
  }
  return select;
}

function textarea(name, value) {
  const input = document.createElement("textarea");
  input.name = name;
  input.value = value || "";
  input.rows = 3;
  return input;
}

export function getFilteredEntries(dataset, filters) {
  const query = String(filters.query || "").trim().toLocaleLowerCase("ja");

  return dataset.entries.filter((entry) => {
    if (filters.category && entry.category !== filters.category) {
      return false;
    }
    if (filters.learningPriority && entry.learningPriority !== filters.learningPriority) {
      return false;
    }
    if (filters.enabled === "enabled" && entry.enabledByDefault === false) {
      return false;
    }
    if (filters.enabled === "disabled" && entry.enabledByDefault !== false) {
      return false;
    }
    if (!query) {
      return true;
    }
    return [entry.displayName, entry.answer, entry.category, entry.family, entry.id]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("ja")
      .includes(query);
  });
}

export function renderWorkbenchList(container, dataset, selectedId, filters, onSelect) {
  container.replaceChildren();
  const entries = getFilteredEntries(dataset, filters);
  container.append(
    element("p", "workbench-result-count", entries.length + " / " + dataset.entries.length + " 語"),
  );

  const list = element("div", "workbench-term-list");
  for (const entry of entries) {
    const button = element("button", "workbench-term-button");
    button.type = "button";
    button.classList.toggle("workbench-term-button--active", entry.id === selectedId);
    button.setAttribute("aria-pressed", String(entry.id === selectedId));
    button.append(
      element("strong", null, entry.displayName),
      element("span", null, entry.answer + " · " + entry.category),
      element(
        "small",
        null,
        entry.learningPriority + "学習 / " + entry.crosswordPriority + "盤面" + (entry.enabledByDefault === false ? " · 出題OFF" : ""),
      ),
    );
    button.addEventListener("click", () => onSelect(entry.id));
    list.append(button);
  }
  container.append(list);
  return entries;
}

function renderClueEditor(entry) {
  const section = element("section", "workbench-clues");
  section.append(element("h2", null, "ヒント"));

  const clues = [...entry.clues].sort((left, right) => left.level - right.level);
  for (const [index, clue] of clues.entries()) {
    const row = element("fieldset", "workbench-clue-row");
    row.append(element("legend", null, "Level " + clue.level));
    const level = textInput("clue-level-" + index, String(clue.level));
    level.type = "number";
    level.min = "1";
    level.max = "3";
    row.append(
      field("難度", level),
      field("種類", textInput("clue-type-" + index, clue.type)),
      field("本文", textarea("clue-text-" + index, clue.text)),
    );
    section.append(row);
  }
  return section;
}

export function renderWorkbenchEditor(container, entry, onSubmit) {
  container.replaceChildren();
  if (!entry) {
    container.append(element("p", "workbench-empty", "左の一覧から用語を選択してください。"));
    return;
  }

  const form = element("form", "workbench-editor-form");
  form.noValidate = true;
  form.append(
    element("p", "workbench-entry-id", entry.id),
    field("表示名", textInput("displayName", entry.displayName)),
    field("盤面の答え", textInput("answer", entry.answer)),
    field("分類", textInput("category", entry.category)),
    field("family", textInput("family", entry.family || "")),
    field(
      "学習優先度",
      selectInput("learningPriority", entry.learningPriority, ["A", "B", "C"]),
    ),
    field(
      "盤面優先度",
      selectInput("crosswordPriority", entry.crosswordPriority, ["A", "B", "C"]),
    ),
  );

  const weight = textInput("selectionWeight", String(entry.selectionWeight));
  weight.type = "number";
  weight.min = "1";
  weight.step = "1";
  form.append(field("選択重み", weight));

  const enabled = document.createElement("input");
  enabled.name = "enabledByDefault";
  enabled.type = "checkbox";
  enabled.checked = entry.enabledByDefault !== false;
  form.append(field("通常出題", enabled));
  form.append(field("メモ", textarea("note", entry.note || "")));
  form.append(renderClueEditor(entry));

  const submit = element("button", "primary-button", "この語の修正を保存");
  submit.type = "submit";
  form.append(submit);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit(form, entry);
  });
  container.append(form);
}

export function readEntryForm(form, entry) {
  const formData = new FormData(form);
  const clues = entry.clues.map((_, index) => ({
    level: formData.get("clue-level-" + index),
    type: formData.get("clue-type-" + index),
    text: formData.get("clue-text-" + index),
  }));

  return {
    displayName: formData.get("displayName"),
    answer: formData.get("answer"),
    category: formData.get("category"),
    family: formData.get("family"),
    learningPriority: formData.get("learningPriority"),
    crosswordPriority: formData.get("crosswordPriority"),
    selectionWeight: formData.get("selectionWeight"),
    enabledByDefault: formData.get("enabledByDefault") === "on",
    note: formData.get("note"),
    clues,
  };
}
