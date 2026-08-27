import assert from "node:assert/strict";
import test from "node:test";

import { createSoundEffects } from "../../src/audio/sound-effects.js";

test("Web Audio非対応環境でも効果音操作は安全に無視される", () => {
  const effects = createSoundEffects();

  assert.doesNotThrow(() => {
    effects.unlock();
    effects.playCorrect();
    effects.setEnabled(false);
    effects.playCorrect(true);
  });
});
