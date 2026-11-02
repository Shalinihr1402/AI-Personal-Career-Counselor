/**
 * onboardingDraft.ts
 * Authenticated user-specific draft persistence for onboarding.
 * Ensures drafts are scoped strictly to user.id and never shared across accounts.
 */

export function getDraftStorageKey(userId: string): string {
  return `onboarding_draft_${userId}`;
}

export function getStepStorageKey(userId: string): string {
  return `onboarding_step_${userId}`;
}

/**
 * Safely loads the saved onboarding data draft for the specified user.
 * Returns null if no draft exists, user is null, or if stored JSON is corrupt.
 */
export function loadUserDraft<T>(userId: string | null | undefined): T | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(getDraftStorageKey(userId));
    if (!raw || raw.trim() === '') return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[onboardingDraft] Failed to load draft for user ${userId}:`, err);
    return null;
  }
}

/**
 * Safely loads the active onboarding step index for the specified user.
 * Validates that the index is a valid non-negative integer within [0, maxSteps - 1].
 */
export function loadUserStep(userId: string | null | undefined, maxSteps: number = 6): number {
  if (!userId) return 0;
  try {
    const raw = localStorage.getItem(getStepStorageKey(userId));
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed < 0 || parsed >= maxSteps) return 0;
    return parsed;
  } catch (err) {
    console.warn(`[onboardingDraft] Failed to load step for user ${userId}:`, err);
    return 0;
  }
}

/**
 * Safely saves the user's onboarding answers to localStorage.
 */
export function saveUserDraft<T>(userId: string | null | undefined, data: T): void {
  if (!userId) return;
  try {
    localStorage.setItem(getDraftStorageKey(userId), JSON.stringify(data));
  } catch (err) {
    console.warn(`[onboardingDraft] Failed to save draft for user ${userId}:`, err);
  }
}

/**
 * Safely saves the user's current step index to localStorage.
 */
export function saveUserStep(userId: string | null | undefined, step: number): void {
  if (!userId) return;
  try {
    localStorage.setItem(getStepStorageKey(userId), String(step));
  } catch (err) {
    console.warn(`[onboardingDraft] Failed to save step for user ${userId}:`, err);
  }
}

/**
 * Clears the user's saved draft and step upon confirmed successful submission to Supabase.
 */
export function clearUserDraft(userId: string | null | undefined): void {
  if (!userId) return;
  try {
    localStorage.removeItem(getDraftStorageKey(userId));
    localStorage.removeItem(getStepStorageKey(userId));
  } catch (err) {
    console.warn(`[onboardingDraft] Failed to clear draft for user ${userId}:`, err);
  }
}
