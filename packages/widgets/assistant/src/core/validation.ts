export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const DEFAULT_MAX_DEPTH = 10;

function sanitizeRecord(
  record: Record<string, unknown>,
  maxDepth: number,
  currentDepth: number,
): Record<string, unknown> {
  if (currentDepth >= maxDepth) return {};

  const safe: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(record)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    if (
      typeof val === "function" ||
      typeof val === "symbol" ||
      val === undefined
    ) {
      continue;
    }
    if (isRecord(val)) {
      safe[key] = sanitizeRecord(val, maxDepth, currentDepth + 1);
    } else if (Array.isArray(val)) {
      safe[key] = sanitizeArray(val, maxDepth, currentDepth + 1);
    } else {
      safe[key] = val;
    }
  }
  return safe;
}

function sanitizeArray(
  arr: unknown[],
  maxDepth: number,
  currentDepth: number,
): unknown[] {
  if (currentDepth >= maxDepth) return [];

  const safeArr: unknown[] = [];
  for (const item of arr) {
    if (
      typeof item === "function" ||
      typeof item === "symbol" ||
      item === undefined
    ) {
      continue;
    }
    if (isRecord(item)) {
      safeArr.push(sanitizeRecord(item, maxDepth, currentDepth + 1));
    } else if (Array.isArray(item)) {
      safeArr.push(sanitizeArray(item, maxDepth, currentDepth + 1));
    } else {
      safeArr.push(item);
    }
  }
  return safeArr;
}

export function sanitizeContext(
  value: unknown,
  maxDepth: number = DEFAULT_MAX_DEPTH,
): Record<string, unknown> {
  if (!isRecord(value)) {
    return {};
  }
  return sanitizeRecord(value, maxDepth, 0);
}

export const sanitizeTriggerContext = sanitizeContext;
