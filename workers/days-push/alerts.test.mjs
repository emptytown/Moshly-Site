import assert from 'node:assert/strict';
import { collectAlerts, dueAlerts } from './src/alerts.js';

const now = Date.parse('2026-11-25T12:00:00Z');
const iso = (m) => new Date(now + m * 60_000).toISOString();
const data = {
  tasks: [
    { id: 'a', title: 'Past due', isCompleted: false, alertDate: iso(-5) },
    { id: 'b', title: 'Future', isCompleted: false, alertDate: iso(30) },
    { id: 'c', title: 'Done', isCompleted: true, alertDate: iso(-5) },
    { id: 'd', title: 'Too old', isCompleted: false, alertDate: iso(-60 * 30) },
    { id: 'e', title: 'List', isCompleted: false, checklists: [{ id: 'cl', items: [
      { id: 'i1', text: 'Call', isChecked: false, alertDate: iso(-1) },
      { id: 'i2', text: 'Done item', isChecked: true, alertDate: iso(-1) },
    ] }] },
    { id: 'f', title: 'No alert', isCompleted: false },
  ],
};
const due = dueAlerts(data, new Set(), now);
assert.deepEqual(due.map((a) => a.title).sort(), ['Past due', 'Reminder: Call']);
assert.equal(due.find((a) => a.title === 'Past due').key, `a:${now - 5 * 60_000}`);
// already sent → skipped
assert.equal(dueAlerts(data, new Set(due.map((a) => a.key)), now).length, 0);
assert.equal(collectAlerts({}).length, 0);
console.log('alerts ok');
