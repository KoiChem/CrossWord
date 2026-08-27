import assert from "node:assert/strict";
import test from "node:test";

import { createTapController } from "../../src/player/tap-controller.js";

test("同じ単語を短時間に2回選ぶと入力開始用のダブルタップになる", () => {
  let timestamp = 1_000;
  const tap = createTapController({ now: () => timestamp, windowMs: 320 });

  assert.equal(tap.register("ethanol"), false);
  timestamp += 280;
  assert.equal(tap.register("ethanol"), true);
});

test("別の単語や時間超過はダブルタップとして扱わない", () => {
  let timestamp = 1_000;
  const tap = createTapController({ now: () => timestamp, windowMs: 320 });

  tap.register("ethanol");
  timestamp += 180;
  assert.equal(tap.register("acetic_acid"), false);
  timestamp += 321;
  assert.equal(tap.register("acetic_acid"), false);
});
