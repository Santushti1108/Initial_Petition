const STORAGE_KEY = "nyayalens_analysis_history";
const MAX_ITEMS = 50;

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getHistory() {
  return readAll().sort(
    (a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
  );
}

export function getHistoryItem(id) {
  return readAll().find((item) => item.id === id) ?? null;
}

export function saveToHistory({ fileName, analysis }) {
  const entry = {
    id: crypto.randomUUID(),
    fileName,
    analysis,
    analyzedAt: new Date().toISOString(),
  };

  const items = [entry, ...readAll()].slice(0, MAX_ITEMS);
  writeAll(items);
  return entry;
}

export function removeFromHistory(id) {
  writeAll(readAll().filter((item) => item.id !== id));
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
