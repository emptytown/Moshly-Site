// Which Days alerts are due. Pure, so it can be tested without Cloudflare.
//
// Mirrors the Days app (src/hooks/useChecklistReminders.ts): the alert `key`
// is also the notification `tag`, so a push and the app's own local
// notification for the same alert replace each other instead of doubling.

export const CATCH_UP_WINDOW_MS = 24 * 60 * 60 * 1000;

function toMs(value) {
  if (value == null) return NaN;
  const ms = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(ms) ? ms : NaN;
}

/** All alerts in a user's Days data, due or not. */
export function collectAlerts(data) {
  const alerts = [];
  for (const task of Array.isArray(data?.tasks) ? data.tasks : []) {
    if (!task || typeof task.id !== 'string') continue;
    const title = typeof task.title === 'string' ? task.title : 'Task';

    const at = toMs(task.alertDate);
    if (!task.isCompleted && Number.isFinite(at)) {
      alerts.push({ key: `${task.id}:${at}`, at, title, body: 'Due soon' });
    }
    for (const checklist of Array.isArray(task.checklists) ? task.checklists : []) {
      for (const item of Array.isArray(checklist?.items) ? checklist.items : []) {
        const itemAt = toMs(item?.alertDate);
        if (!item || item.isChecked || !Number.isFinite(itemAt)) continue;
        alerts.push({ key: `${task.id}:${item.id}:${itemAt}`, at: itemAt, title: `Reminder: ${item.text}`, body: title });
      }
    }
  }
  return alerts;
}

/** Alerts that came due since the last window and weren't sent yet. */
export function dueAlerts(data, sentKeys, now = Date.now()) {
  return collectAlerts(data).filter(
    (a) => a.at <= now && now - a.at <= CATCH_UP_WINDOW_MS && !sentKeys.has(a.key)
  );
}
