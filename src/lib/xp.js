/**
 * XP Progression Algorithm & Utilities
 *
 * Rules:
 * - Level 1 requires 100 XP to advance.
 * - Levels 1-10 increment by 25 per level (L1: 100, L2: 125, L3: 150, ..., L10: 325).
 * - Levels 11-20 increment by 50 per level (L11: 375, ..., L20: 825).
 * - Levels 21-30 increment by 75 per level (L21: 900, ..., L30: 1575).
 * - Every 10 levels, the step increases by 25 (tier * 25).
 * - If XP falls below 0 upon deduction, keep the current level and allow XP to be negative.
 */

export function getRequiredXpForLevel(level) {
  const lvl = Math.max(1, Math.floor(Number(level) || 1));
  if (lvl === 1) return 100;

  let req = 100;
  for (let l = 2; l <= lvl; l++) {
    const bracket = Math.floor((l - 1) / 10) + 1;
    req += bracket * 25;
  }
  return req;
}

export function calculateXpChange(currentLevel, currentXp, deltaXp) {
  let level = Math.max(1, Math.floor(Number(currentLevel) || 1));
  let xp = Math.round(((Number(currentXp) || 0) + Number(deltaXp)) * 10) / 10;
  let leveledUp = false;
  let newLevels = 0;

  if (deltaXp > 0) {
    let req = getRequiredXpForLevel(level);
    while (xp >= req) {
      xp = Math.round((xp - req) * 10) / 10;
      level += 1;
      leveledUp = true;
      newLevels += 1;
      req = getRequiredXpForLevel(level);
    }
  }

  return {
    level,
    xp,
    leveledUp,
    newLevels,
  };
}
