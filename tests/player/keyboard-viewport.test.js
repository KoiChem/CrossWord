import assert from "node:assert/strict";
import test from "node:test";

import { createKeyboardViewportTracker } from "../../src/player/keyboard-viewport.js";

test("キーボード表示への遷移だけを一度だけ検出する", () => {
  const tracker = createKeyboardViewportTracker();
  tracker.begin(800);

  assert.equal(tracker.update(760), false);
  assert.equal(tracker.update(620), true);
  assert.equal(tracker.update(610), false);
});

test("キーボードを閉じた後は、次の表示を再び検出できる", () => {
  const tracker = createKeyboardViewportTracker();
  tracker.begin(800);

  assert.equal(tracker.update(620), true);
  assert.equal(tracker.update(790), false);
  assert.equal(tracker.update(620), true);
});

test("追跡をリセットすると、古い表示領域を使わない", () => {
  const tracker = createKeyboardViewportTracker();
  tracker.begin(800);
  tracker.reset();

  assert.equal(tracker.update(620), false);
});
