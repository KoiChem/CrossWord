const UINT32_MAX_PLUS_ONE = 4294967296;

export function hashText(value) {
  const text = String(value);
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function normalizeSeed(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    return Math.trunc(seed) >>> 0;
  }

  if (typeof seed === "string" && /^\d+$/.test(seed.trim())) {
    return Number(seed.trim()) >>> 0;
  }

  return hashText(seed);
}

export function createRandomSeed() {
  if (globalThis.crypto && globalThis.crypto.getRandomValues) {
    const buffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buffer);
    return buffer[0];
  }

  return normalizeSeed(String(Date.now()) + ":" + String(Math.random()));
}

export class SeededRandom {
  constructor(seed) {
    this.seed = normalizeSeed(seed);
    this.state = this.seed;
  }

  nextUint32() {
    let value = (this.state += 1831565813);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return (value ^ (value >>> 14)) >>> 0;
  }

  next() {
    return this.nextUint32() / UINT32_MAX_PLUS_ONE;
  }

  integer(maxExclusive) {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new Error("integer の上限は正の整数で指定してください。");
    }

    return Math.floor(this.next() * maxExclusive);
  }

  pick(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return undefined;
    }

    return items[this.integer(items.length)];
  }

  shuffle(items) {
    const result = [...items];

    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = this.integer(index + 1);
      [result[index], result[swapIndex]] = [
        result[swapIndex],
        result[index],
      ];
    }

    return result;
  }

  weightedPick(items, weightOf) {
    const weighted = items.map((item) => ({
      item,
      weight: Math.max(0, Number(weightOf(item)) || 0),
    }));
    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);

    if (total <= 0) {
      return this.pick(items);
    }

    let cursor = this.next() * total;

    for (const entry of weighted) {
      cursor -= entry.weight;
      if (cursor <= 0) {
        return entry.item;
      }
    }

    return weighted[weighted.length - 1].item;
  }
}
