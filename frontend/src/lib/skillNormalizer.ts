/**
 * skillNormalizer.ts
 *
 * Centralized skill normalization utilities for the frontend.
 * Converts any skill representation (string, structured UserSkill,
 * custom skills, or skills_and_experience containers) into a clean,
 * case-insensitively deduplicated array of strings: string[].
 */

export function normalizeSingleSkill(item: unknown): string {
  if (item === null || item === undefined) {
    return '';
  }

  if (typeof item === 'string') {
    return item.trim();
  }

  if (typeof item === 'object') {
    const obj = item as Record<string, unknown>;
    for (const key of ['name', 'skill_name', 'skill', 'title', 'label']) {
      const val = obj[key];
      if (typeof val === 'string' && val.trim()) {
        return val.trim();
      }
    }
    return '';
  }

  const s = String(item).trim();
  return s && !s.startsWith('[object') ? s : '';
}

export function normalizeSkills(skillsInput: unknown): string[] {
  if (!skillsInput) {
    return [];
  }

  const itemsToProcess: unknown[] = [];

  function collect(val: unknown): void {
    if (val === null || val === undefined || val === '') return;
    if (Array.isArray(val)) {
      for (const v of val) {
        collect(v);
      }
    } else if (typeof val === 'object') {
      const obj = val as Record<string, unknown>;
      let hasSub = false;
      if (Array.isArray(obj.skills)) {
        collect(obj.skills);
        hasSub = true;
      }
      if (Array.isArray(obj.custom_skills)) {
        collect(obj.custom_skills);
        hasSub = true;
      }
      if (!hasSub) {
        itemsToProcess.push(val);
      }
    } else {
      itemsToProcess.push(val);
    }
  }

  collect(skillsInput);

  const seenLower = new Set<string>();
  const result: string[] = [];

  for (const item of itemsToProcess) {
    const name = normalizeSingleSkill(item);
    if (name) {
      const lower = name.toLowerCase();
      if (!seenLower.has(lower)) {
        seenLower.add(lower);
        result.push(name);
      }
    }
  }

  return result;
}
