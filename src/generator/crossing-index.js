function pairKey(firstId, secondId) {
  return firstId < secondId
    ? firstId + "\u0000" + secondId
    : secondId + "\u0000" + firstId;
}

export function createCrossingIndex(terms) {
  const termById = new Map(terms.map((term) => [term.id, term]));
  const occurrenceByCharacter = new Map();

  for (const term of terms) {
    for (const [index, char] of Array.from(term.answer).entries()) {
      const occurrences = occurrenceByCharacter.get(char) || [];
      occurrences.push({ termId: term.id, index, char });
      occurrenceByCharacter.set(char, occurrences);
    }
  }

  const pairs = new Map();
  const neighbors = new Map(terms.map((term) => [term.id, new Set()]));

  for (const occurrences of occurrenceByCharacter.values()) {
    for (let left = 0; left < occurrences.length; left += 1) {
      for (let right = left + 1; right < occurrences.length; right += 1) {
        const first = occurrences[left];
        const second = occurrences[right];

        if (first.termId === second.termId) {
          continue;
        }

        const key = pairKey(first.termId, second.termId);
        const pair = pairs.get(key) || [];
        pair.push({
          firstId: first.termId,
          firstIndex: first.index,
          secondId: second.termId,
          secondIndex: second.index,
          char: first.char,
        });
        pairs.set(key, pair);
        neighbors.get(first.termId).add(second.termId);
        neighbors.get(second.termId).add(first.termId);
      }
    }
  }

  return { termById, occurrenceByCharacter, pairs, neighbors };
}

export function getCrossings(index, firstId, secondId) {
  const stored = index.pairs.get(pairKey(firstId, secondId)) || [];

  return stored.map((crossing) => {
    if (crossing.firstId === firstId) {
      return {
        firstIndex: crossing.firstIndex,
        secondIndex: crossing.secondIndex,
        char: crossing.char,
      };
    }

    return {
      firstIndex: crossing.secondIndex,
      secondIndex: crossing.firstIndex,
      char: crossing.char,
    };
  });
}

export function crossingDegree(index, termId) {
  return index.neighbors.get(termId)?.size || 0;
}
