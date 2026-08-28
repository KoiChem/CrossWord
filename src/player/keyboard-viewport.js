const DEFAULT_KEYBOARD_THRESHOLD = 80;

// Tracks the one transition that needs a scroll correction: the software
// keyboard becoming visible. Browser chrome and ordinary page scrolling must
// not be treated as reasons to pull the player back to the active cell.
export function createKeyboardViewportTracker(
  threshold = DEFAULT_KEYBOARD_THRESHOLD,
) {
  let baselineHeight = null;
  let keyboardVisible = false;

  function begin(viewportHeight) {
    baselineHeight = Number.isFinite(viewportHeight) ? viewportHeight : null;
    keyboardVisible = false;
  }

  function update(viewportHeight) {
    if (!Number.isFinite(baselineHeight) || !Number.isFinite(viewportHeight)) {
      return false;
    }

    const heightLoss = baselineHeight - viewportHeight;

    if (keyboardVisible) {
      if (heightLoss < threshold / 2) {
        keyboardVisible = false;
      }
      return false;
    }

    if (heightLoss >= threshold) {
      keyboardVisible = true;
      return true;
    }

    return false;
  }

  function reset() {
    baselineHeight = null;
    keyboardVisible = false;
  }

  return { begin, update, reset };
}
