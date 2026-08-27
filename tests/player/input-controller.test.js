import assert from "node:assert/strict";
import test from "node:test";

import { createImeInputController } from "../../src/player/input-controller.js";

function createFakeInput() {
  const listeners = new Map();

  return {
    value: "",
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    emit(type, event = {}) {
      listeners.get(type)?.({
        isComposing: false,
        preventDefault() {},
        ...event,
      });
    },
    focus() {},
  };
}

test("composition中の文字列は触らず、確定時に一度だけ反映する", async () => {
  const input = createFakeInput();
  const received = [];
  const previews = [];
  createImeInputController(input, {
    onCharacters(characters) {
      received.push(characters);
    },
    onCompositionPreview(characters) {
      previews.push(characters);
    },
    onBackspace() {},
    onMove() {},
    onToggleDirection() {},
  });

  input.emit("compositionstart");
  input.value = "エタノール";
  input.emit("compositionupdate", { data: "エタノール" });
  input.emit("input", { data: "エタノール", isComposing: true });
  assert.deepEqual(received, []);
  assert.equal(input.value, "エタノール");
  assert.deepEqual(previews.at(-1), ["え", "た", "の", "ー", "る"]);

  input.emit("compositionend", { data: "エタノール" });
  input.emit("input", { data: "エタノール" });
  await Promise.resolve();

  assert.deepEqual(received, [["え", "た", "の", "ー", "る"]]);
  assert.equal(input.value, "");
});

test("composition中の無効な文字はプレビューを空にして、確定回答にしない", () => {
  const input = createFakeInput();
  const previews = [];
  createImeInputController(input, {
    onCharacters() {},
    onCompositionPreview(characters) {
      previews.push(characters);
    },
    onBackspace() {},
    onMove() {},
    onToggleDirection() {},
  });

  input.emit("compositionstart");
  input.value = "有機化学";
  input.emit("compositionupdate", { data: "有機化学" });

  assert.deepEqual(previews.at(-1), []);
});

test("確定済みのBackspaceと矢印キーをプレイヤーへ渡す", () => {
  const input = createFakeInput();
  const events = [];
  createImeInputController(input, {
    onCharacters() {},
    onBackspace() {
      events.push("backspace");
    },
    onMove(delta) {
      events.push("move:" + delta);
    },
    onToggleDirection() {
      events.push("toggle");
    },
  });

  input.emit("keydown", { key: "Backspace" });
  input.emit("keydown", { key: "ArrowRight" });
  input.emit("keydown", { key: "Enter" });

  assert.deepEqual(events, ["backspace", "move:1", "toggle"]);
});
