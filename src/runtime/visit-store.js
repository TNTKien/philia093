export const VISIT_STORAGE_KEY = "aha.was-here";

function resolveStorage(storage) {
  if (storage) return storage;

  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readVisitTimestamp(storage) {
  try {
    return resolveStorage(storage)?.getItem(VISIT_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function hasVisited(storage) {
  return readVisitTimestamp(storage) !== null;
}

export function markVisited(storage, date = new Date()) {
  try {
    const target = resolveStorage(storage);
    if (!target) return false;

    target.setItem(VISIT_STORAGE_KEY, date.toISOString());
    return true;
  } catch {
    return false;
  }
}

export function clearVisit(storage) {
  try {
    resolveStorage(storage)?.removeItem(VISIT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
