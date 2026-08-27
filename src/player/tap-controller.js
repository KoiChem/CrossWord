const DEFAULT_DOUBLE_TAP_WINDOW_MS = 320;

/**
 * Cell buttons are replaced after a render, so browser dblclick events are not
 * a dependable touch interaction.  This small stateful recognizer keeps the
 * puzzle's intended "tap to read, tap again to type" contract independent of
 * the browser's mouse-event synthesis.
 */
export function createTapController(options = {}) {
  const now = options.now || (() => Date.now());
  const windowMs = options.windowMs || DEFAULT_DOUBLE_TAP_WINDOW_MS;
  let previous = null;

  function register(wordId) {
    const timestamp = now();
    const isDoubleTap = Boolean(
      wordId &&
        previous?.wordId === wordId &&
        timestamp - previous.timestamp <= windowMs,
    );

    previous = isDoubleTap ? null : { wordId, timestamp };
    return isDoubleTap;
  }

  function reset() {
    previous = null;
  }

  return { register, reset };
}
