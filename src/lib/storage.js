// LocalStorage wrappers. Single source of truth for the storage keys we use.

const KEYS = {
  user: "ivicuo:user",
  projects: "ivicuo:projects",
  projectsAt: "ivicuo:projects:fetchedAt",
  conversation: (projectId) => `ivicuo:conv:${projectId}`,
  summaries: (projectId) => `ivicuo:summaries:${projectId}`,
};

const ONE_HOUR = 60 * 60 * 1000;

export function getUser() {
  try { return JSON.parse(localStorage.getItem(KEYS.user) || "null"); } catch { return null; }
}
export function saveUser(user) {
  localStorage.setItem(KEYS.user, JSON.stringify(user));
}
export function clearUser() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith("ivicuo:"))
    .forEach((k) => localStorage.removeItem(k));
}

export function getProjectsCache() {
  const at = parseInt(localStorage.getItem(KEYS.projectsAt) || "0", 10);
  if (!at || Date.now() - at > ONE_HOUR) return null;
  try { return JSON.parse(localStorage.getItem(KEYS.projects) || "null"); } catch { return null; }
}
export function saveProjectsCache(projects) {
  localStorage.setItem(KEYS.projects, JSON.stringify(projects));
  localStorage.setItem(KEYS.projectsAt, String(Date.now()));
}
export function getProjectsCacheAge() {
  const at = parseInt(localStorage.getItem(KEYS.projectsAt) || "0", 10);
  return at ? Date.now() - at : null;
}

export function getConversation(projectId) {
  try { return JSON.parse(localStorage.getItem(KEYS.conversation(projectId)) || "[]"); } catch { return []; }
}
export function saveConversation(projectId, messages) {
  localStorage.setItem(KEYS.conversation(projectId), JSON.stringify(messages));
}
export function clearConversation(projectId) {
  localStorage.removeItem(KEYS.conversation(projectId));
}

export function getSummaries(projectId) {
  try { return JSON.parse(localStorage.getItem(KEYS.summaries(projectId)) || "[]"); } catch { return []; }
}
export function appendSummary(projectId, summary) {
  const arr = getSummaries(projectId);
  arr.unshift({ ...summary, at: new Date().toISOString() });
  localStorage.setItem(KEYS.summaries(projectId), JSON.stringify(arr.slice(0, 10)));
}
