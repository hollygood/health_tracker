/** On-device storage. Everything lives in this browser's localStorage. */

export type Sex = 'female' | 'male';

export interface Profile {
  id: string;
  name: string;
  /** yyyy-mm-dd */
  birthday: string;
  sex: Sex;
  /** Latest known weight, used to suggest doses. */
  weightKg?: number;
  /** ISO datetime the weight was saved. */
  weightUpdatedAt?: string;
}

export interface AppData {
  profiles: Profile[];
  activeProfileId: string | null;
}

const KEY = 'health-tracker:v1';
const EMPTY: AppData = { profiles: [], activeProfileId: null };

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
      activeProfileId: parsed.activeProfileId ?? null,
    };
  } catch {
    return EMPTY;
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable (private mode / full): keep working in memory.
  }
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ageText(birthday: string, now = new Date()): string {
  const b = new Date(`${birthday}T00:00:00`);
  if (Number.isNaN(b.getTime())) return '';
  let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) months -= 1;
  if (months < 0) return '';
  if (months < 24) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem ? `${years} y ${rem} mo` : `${years} y`;
}
