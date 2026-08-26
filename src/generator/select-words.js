import { crossingDegree } from "./crossing-index.js";
import { countFamilies } from "./validator.js";

const PRIORITY_WEIGHT = Object.freeze({
  A: 1.25,
  B: 0.9,
  C: 0.45,
});

function baseSelectionWeight(term) {
  const learning = PRIORITY_WEIGHT[term.learningPriority] || 1;
  const crossword = PRIORITY_WEIGHT[term.crosswordPriority] || 1;
  const explicit = Math.max(1, Number(term.selectionWeight) || 1);
  return learning * crossword * explicit;
}

function familyKey(term) {
  return term.family || null;
}

function isWithinFamilyLimit(term, selected, maxFamilyCount) {
  const family = familyKey(term);
  if (!family) {
    return true;
  }

  return (
    selected.filter((candidate) => familyKey(candidate) === family).length <
    maxFamilyCount
  );
}

function anchorWeight(term, crossingIndex, config) {
  const length = Array.from(term.answer).length;
  const preferredLength = Math.max(4, Math.floor(config.width * 0.62));
  const lengthFactor = Math.max(
    0.35,
    1 - Math.abs(length - preferredLength) / config.width,
  );
  const degreeFactor = Math.sqrt(crossingDegree(crossingIndex, term.id) + 1);
  return baseSelectionWeight(term) * lengthFactor * degreeFactor;
}

function candidateWeight(candidate, anchor, crossingIndex) {
  const sameCategory = candidate.category === anchor.category;
  const categoryFactor = sameCategory ? 1.7 : 1;
  const degreeFactor = Math.sqrt(crossingDegree(crossingIndex, candidate.id) + 1);
  return baseSelectionWeight(candidate) * categoryFactor * degreeFactor;
}

export function getEligibleTerms(terms, config, crossingIndex) {
  return terms.filter((term) => {
    const length = Array.from(term.answer).length;
    return (
      term.enabledByDefault !== false &&
      length >= 3 &&
      length <= Math.min(config.width, config.height) &&
      crossingDegree(crossingIndex, term.id) > 0
    );
  });
}

export function selectCandidatePool(terms, config, crossingIndex, random) {
  const eligible = getEligibleTerms(terms, config, crossingIndex);

  if (eligible.length < config.minWords) {
    throw new Error("この盤面サイズで利用可能な語が不足しています。");
  }

  const anchor = random.weightedPick(eligible, (term) =>
    anchorWeight(term, crossingIndex, config),
  );
  const selected = [anchor];
  const remaining = eligible.filter((term) => term.id !== anchor.id);

  while (selected.length < Math.min(config.candidatePoolSize, eligible.length)) {
    const familyCounts = countFamilies(selected);
    const candidates = remaining.filter((term) => {
      const family = familyKey(term);
      return !family || (familyCounts.get(family) || 0) < config.maxFamilyCount;
    });

    if (candidates.length === 0) {
      break;
    }

    const next = random.weightedPick(candidates, (term) =>
      candidateWeight(term, anchor, crossingIndex),
    );
    selected.push(next);
    remaining.splice(
      remaining.findIndex((term) => term.id === next.id),
      1,
    );
  }

  return selected;
}
