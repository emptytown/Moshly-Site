// Merge rule for Moshly Days data synced between devices.
// Mirrored in the Days app (src/lib/sync.ts) — keep the two in step.
//
// Data: { version: 1, tasks: Task[], tombstones: { [taskId]: deletedAtMs } }
//   - each task carries updatedAt (ms); the newest copy of a task wins
//   - a delete wins over any copy of the task that is not newer than it
//   - tombstones are dropped after 90 days

const TOMBSTONE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export function emptyDaysData() {
  return { version: 1, tasks: [], tombstones: {}, updatedAt: 0 };
}

function normalise(data) {
  const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
  const tombstones = data && typeof data.tombstones === 'object' && !Array.isArray(data.tombstones) ? data.tombstones : {};
  return { tasks, tombstones };
}

const stamp = (t) => (typeof t?.updatedAt === 'number' && Number.isFinite(t.updatedAt) ? t.updatedAt : 0);

/** Merge two copies; on an exact tie, `primary` wins. */
export function mergeDaysData(primary, secondary, now = Date.now()) {
  const a = normalise(primary);
  const b = normalise(secondary);

  const tombstones = {};
  for (const source of [a.tombstones, b.tombstones]) {
    for (const [id, ts] of Object.entries(source)) {
      if (typeof ts !== 'number' || !Number.isFinite(ts)) continue;
      if (now - ts > TOMBSTONE_TTL_MS) continue;
      if (!(id in tombstones) || ts > tombstones[id]) tombstones[id] = ts;
    }
  }

  const byId = new Map();
  for (const task of [...a.tasks, ...b.tasks]) {
    if (!task || typeof task.id !== 'string') continue;
    const current = byId.get(task.id);
    if (!current || stamp(task) > stamp(current)) byId.set(task.id, task);
  }

  const tasks = [];
  for (const [id, task] of byId) {
    const deletedAt = tombstones[id];
    if (deletedAt !== undefined && deletedAt >= stamp(task)) continue; // deleted
    if (deletedAt !== undefined) delete tombstones[id];                 // restored later
    tasks.push(task);
  }

  return { version: 1, tasks, tombstones, updatedAt: now };
}
