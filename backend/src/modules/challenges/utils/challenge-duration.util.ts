/**
 * Utility for computing the minimum challenge duration based on the number
 * of games the validator requires.
 *
 * Rules (set by product):
 *   1–5 games needed  →  7 days minimum  (1 natural week, Sat/Sun included)
 *   6+ games needed   → 14 days minimum  (2 natural weeks)
 *
 * Allowed duration values: 7 | 14 | 21 | 28 days (weekly steps, max 1 month)
 */

export const ALLOWED_DURATION_DAYS = [7, 14, 21, 28] as const;
export type AllowedDurationDays = (typeof ALLOWED_DURATION_DAYS)[number];

/**
 * Validators that expose an explicit `games` parameter driving the game count.
 * All other validators default to 1 game for the purpose of the minimum check.
 */
const GAMES_PARAM_VALIDATORS = new Set<string>([
  'immortal',
  'deathless_streak',
  'escapist',
  'multikill_master',
  'first_blood_king',
  'visionary',
  'winning_streak',
]);

/**
 * Returns the effective game count from params.
 * Falls back to 1 when the validator doesn't use a 'games' param.
 */
export function getEffectiveGameCount(
  validatorKey: string,
  params: Record<string, unknown>,
): number {
  if (GAMES_PARAM_VALIDATORS.has(validatorKey)) {
    const g = params.games;
    return typeof g === 'number' && g > 0 ? g : 1;
  }
  return 1;
}

/**
 * Returns the minimum allowed duration in days for a challenge.
 * Enforced on the backend at creation time.
 */
export function getMinimumDays(
  validatorKey: string,
  params: Record<string, unknown>,
): 7 | 14 {
  const gameCount = getEffectiveGameCount(validatorKey, params);
  return gameCount >= 6 ? 14 : 7;
}

/**
 * Returns true if the provided duration is valid (allowed value AND >= minimum).
 */
export function isDurationValid(
  durationDays: number,
  validatorKey: string,
  params: Record<string, unknown>,
): boolean {
  if (!(ALLOWED_DURATION_DAYS as readonly number[]).includes(durationDays)) {
    return false;
  }
  return durationDays >= getMinimumDays(validatorKey, params);
}
