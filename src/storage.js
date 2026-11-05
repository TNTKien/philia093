export const VISITOR_KEY = 'aha.was-here';

export function isFirstVisit() {
  try {
    return localStorage.getItem(VISITOR_KEY) === null;
  } catch {
    // Storage can be unavailable in private/restricted browsing contexts.
    return true;
  }
}

export function rememberVisitor() {
  try {
    localStorage.setItem(VISITOR_KEY, new Date().toISOString());
    return true;
  } catch {
    return false;
  }
}

export function resetVisitor() {
  try {
    localStorage.removeItem(VISITOR_KEY);
  } catch {
    // Ignore storage restrictions; this helper is only used for local testing.
  }
}
