import assert from "node:assert/strict";
import test from "node:test";

import {
  createPlayerPreferences,
  DEFAULT_PLAYER_PREFERENCES,
} from "../../src/player/player-preferences.js";

function createStorage(initial = null) {
  let value = initial;
  return {
    getItem() {
      return value;
    },
    setItem(_key, nextValue) {
      value = nextValue;
    },
  };
}

test("プレイヤー設定は正解色と効果音を既定で有効にする", () => {
  const preferences = createPlayerPreferences(createStorage());
  assert.deepEqual(preferences.get(), DEFAULT_PLAYER_PREFERENCES);
});

test("プレイヤー設定は端末内へ保存し、次回読み込み時に復元する", () => {
  const storage = createStorage();
  const first = createPlayerPreferences(storage);
  first.update({ showCorrectColors: false, soundEnabled: false });

  const restored = createPlayerPreferences(storage);
  assert.deepEqual(restored.get(), {
    showCorrectColors: false,
    soundEnabled: false,
  });
});
