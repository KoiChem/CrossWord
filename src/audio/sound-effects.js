function audioContextConstructor() {
  return globalThis.AudioContext || globalThis.webkitAudioContext || null;
}

export function createSoundEffects() {
  let context = null;
  let enabled = true;

  function ensureContext() {
    if (!enabled) {
      return null;
    }

    const AudioContextConstructor = audioContextConstructor();
    if (!AudioContextConstructor) {
      return null;
    }

    try {
      context ||= new AudioContextConstructor();
      if (context.state === "suspended") {
        context.resume?.()?.catch?.(() => {});
      }
    } catch {
      return null;
    }
    return context;
  }

  function unlock() {
    ensureContext();
  }

  function tone(frequency, startAt, duration, volume) {
    const audio = ensureContext();
    if (!audio) {
      return;
    }

    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  }

  function playCorrect(completed = false) {
    const audio = ensureContext();
    if (!audio) {
      return;
    }

    const startAt = audio.currentTime + 0.01;
    tone(completed ? 659.25 : 523.25, startAt, 0.12, 0.045);
    tone(completed ? 783.99 : 659.25, startAt + 0.09, 0.17, 0.04);
    if (completed) {
      tone(987.77, startAt + 0.19, 0.22, 0.04);
    }
  }

  function setEnabled(value) {
    enabled = value !== false;
  }

  return { unlock, playCorrect, setEnabled };
}
