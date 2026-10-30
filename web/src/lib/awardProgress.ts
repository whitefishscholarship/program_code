// Award progress stays on this device. It is not part of the student link,
// and it is never sent to a server.

const AWARD_ID = /^award-[a-f0-9]{12}$/;

export const AWARD_PROGRESS_KEY = 'whitefish-award-progress-v1';

export const PROGRESS_ORDER = ['not_started', 'in_progress', 'completed'] as const;
export type AwardProgress = (typeof PROGRESS_ORDER)[number];
export type ProgressFilter = 'all' | AwardProgress;

export const PROGRESS_LABELS: Record<AwardProgress, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
};

export const PROGRESS_NOTE = 'Progress is saved on this device only. It stays in this browser and is not sent to us.';

export type AwardProgressMap = Readonly<Record<string, AwardProgress>>;

export type ProgressStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export function awardProgress(map: AwardProgressMap, id: string): AwardProgress {
  const value = map[id];
  return value === 'in_progress' || value === 'completed' ? value : 'not_started';
}

export function progressCounts(awards: readonly { publicId: string }[], map: AwardProgressMap): Record<ProgressFilter, number> {
  const counts: Record<ProgressFilter, number> = { all: awards.length, not_started: 0, in_progress: 0, completed: 0 };
  for (const award of awards) counts[awardProgress(map, award.publicId)] += 1;
  return counts;
}

/** Same rules as the progress toggles. All is that control left off. */
export function filterByProgress<T extends { publicId: string }>(awards: readonly T[], map: AwardProgressMap, filter: ProgressFilter): T[] {
  if (filter === 'all') return [...awards];
  return awards.filter((award) => awardProgress(map, award.publicId) === filter);
}

export function setAwardProgress(map: AwardProgressMap, id: string, status: AwardProgress): AwardProgressMap {
  if (!AWARD_ID.test(id)) return map;
  const next: Record<string, AwardProgress> = { ...map };
  if (status === 'not_started') delete next[id];
  else next[id] = status;
  return next;
}

export function parseAwardProgress(raw: string | null): AwardProgressMap {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  const next: Record<string, AwardProgress> = {};
  for (const [id, status] of Object.entries(parsed)) {
    if (!AWARD_ID.test(id)) continue;
    if (status === 'in_progress' || status === 'completed') next[id] = status;
  }
  return next;
}

export function readAwardProgress(storage: Pick<ProgressStorage, 'getItem'>): AwardProgressMap {
  try {
    return parseAwardProgress(storage.getItem(AWARD_PROGRESS_KEY));
  } catch {
    return {};
  }
}

export function writeAwardProgress(storage: ProgressStorage, map: AwardProgressMap): void {
  try {
    const cleaned = parseAwardProgress(JSON.stringify(map));
    if (Object.keys(cleaned).length === 0) {
      storage.removeItem(AWARD_PROGRESS_KEY);
      return;
    }
    storage.setItem(AWARD_PROGRESS_KEY, JSON.stringify(cleaned));
  } catch {
    // A blocked browser store stays on this device. Never send the progress anywhere else.
  }
}

export function clearAwardProgress(storage: Pick<ProgressStorage, 'removeItem'>): void {
  try {
    storage.removeItem(AWARD_PROGRESS_KEY);
  } catch {
    // Same as a blocked write: leave the data where the browser already put it.
  }
}
