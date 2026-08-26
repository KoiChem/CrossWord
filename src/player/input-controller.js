import { normalizeAnswerInput } from "./answer-normalizer.js";

export function createImeInputController(input, handlers) {
  let composing = false;
  let ignoreNextInput = false;

  function clearInput() {
    input.value = "";
  }

  function commit(value) {
    const characters = normalizeAnswerInput(value);
    clearInput();

    if (characters.length > 0) {
      handlers.onCharacters(characters);
    }
  }

  function focus() {
    try {
      input.focus({ preventScroll: true });
    } catch {
      input.focus();
    }
  }

  input.addEventListener("compositionstart", () => {
    composing = true;
  });

  input.addEventListener("compositionend", (event) => {
    composing = false;
    commit(event.data || input.value);
    ignoreNextInput = true;
    queueMicrotask(() => {
      ignoreNextInput = false;
    });
  });

  input.addEventListener("input", (event) => {
    if (composing || event.isComposing) {
      return;
    }

    if (ignoreNextInput) {
      ignoreNextInput = false;
      clearInput();
      return;
    }

    commit(event.data || input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (composing || event.isComposing) {
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      clearInput();
      handlers.onBackspace();
      return;
    }

    const movement = {
      ArrowLeft: -1,
      ArrowUp: -1,
      ArrowRight: 1,
      ArrowDown: 1,
    }[event.key];

    if (movement) {
      event.preventDefault();
      handlers.onMove(movement);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      handlers.onToggleDirection();
    }
  });

  return { focus };
}
