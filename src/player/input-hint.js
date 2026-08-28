// The compact, visual-only input bar always derives its text from the active
// word. It never owns answer state, so changing cells cannot leave a stale
// hint above a mobile keyboard.
export function getInputHint(player) {
  if (!player || player.getMode() !== "input") {
    return null;
  }

  const word = player.getActiveWord();
  if (!word?.clue?.text) {
    return null;
  }

  return {
    label: word.directionLabel + " " + word.number,
    text: word.clue.text,
  };
}
