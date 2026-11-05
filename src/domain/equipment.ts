import type { Equipment } from './types';

const MAX_THRESHOLD = 150;
// Number() alone would also accept forms like 1e2 or 0x10.
const DECIMAL_PATTERN = /^(\d+(\.\d*)?|\.\d+)$/;

export function isAlarm(item: Pick<Equipment, 'enabled' | 'temperature' | 'maxTemp'>): boolean {
  return item.enabled === 1 && item.temperature >= item.maxTemp;
}

// Returns the threshold, or null if the text is not a number in the range (0, 150].
export function parseThreshold(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (!DECIMAL_PATTERN.test(normalized)) return null;
  const value = Number(normalized);
  return value > 0 && value <= MAX_THRESHOLD ? value : null;
}
