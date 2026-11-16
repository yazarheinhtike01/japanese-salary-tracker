'use strict';
const assert = require('assert');
const E = require('../src/engine');
const H = require('../src/holidays');

const BREAKS = [
  { start: '12:00', end: '13:00' },
  { start: '17:00', end: '18:00' },
];
const day = (actualStart, actualEnd, extra) =>
  Object.assign(
    {
      date: '2026-09-07',
      type: 'day',
      scheduledStart: '07:00',
      scheduledEnd: '16:00',
      actualStart,
      actualEnd,
      rate: 1350,
    },
    extra || {}
  );

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log('ok - ' + name);
}

// Spec example 1: late 16 minutes exactly (no 15-min rounding)
check('late 16 min exact', () => {
  const r = E.computeShift(day('07:16', '16:00'), BREAKS);
  assert.strictEqual(r.lateMinutes, 16);
  assert.strictEqual(r.earlyMinutes, 0);
  assert.strictEqual(r.breakMinutes, 60);
  assert.strictEqual(r.payableMinutes, 464); // 8:44 worked - 1:00 break
  assert.strictEqual(r.earnings, 10440); // 464 x 22.5
});

// Spec example 2: early departure 60 minutes
check('early 60 min', () => {
  const r = E.computeShift(day('07:00', '15:00'), BREAKS);
  assert.strictEqual(r.lateMinutes, 0);
  assert.strictEqual(r.earlyMinutes, 60);
  assert.strictEqual(r.payableMinutes, 420);
  assert.strictEqual(r.earnings, 9450);
});

// Spec example 3: late 16 + early 60 together
check('late 16 + early 60', () => {
  const r = E.computeShift(day('07:16', '15:00'), BREAKS);
  assert.strictEqual(r.lateMinutes, 16);
  assert.strictEqual(r.earlyMinutes, 60);
  assert.strictEqual(r.payableMinutes, 404);
  assert.strictEqual(r.earnings, 9090);
});

// Full on-time day shift 07:00-16:00
check('full day shift', () => {
  const r = E.computeShift(day('07:00', '16:00'), BREAKS);
  assert.strictEqual(r.payableMinutes, 480);
  assert.strictEqual(r.earnings, 10800);
});

// Day shift 07:00-17:00: only the lunch break overlaps
check('day shift to 17:00', () => {
  const r = E.computeShift(
    day('07:00', '17:00', { scheduledEnd: '17:00' }),
    BREAKS
  );
  assert.strictEqual(r.breakMinutes, 60);
  assert.strictEqual(r.payableMinutes, 540);
  assert.strictEqual(r.earnings, 12150);
});

// Long day crossing both breaks: each break deducted once, never twice
check('both breaks, no double deduction', () => {
  const r = E.computeShift(
    day('07:00', '18:30', { scheduledEnd: '18:30' }),
    BREAKS
  );
  assert.strictEqual(r.breakMinutes, 120);
  assert.strictEqual(r.payableMinutes, 570);
});

// Evening shift 18:00-22:45 at 1400: the 17:00-18:00 break must NOT deduct
check('evening shift, break before start not deducted', () => {
  const r = E.computeShift(
    {
      date: '2026-09-07',
      type: 'evening',
      scheduledStart: '18:00',
      scheduledEnd: '22:45',
      actualStart: '18:00',
      actualEnd: '22:45',
      rate: 1400,
    },
    BREAKS
  );
  assert.strictEqual(r.breakMinutes, 0);
  assert.strictEqual(r.payableMinutes, 285);
  assert.strictEqual(r.earnings, 6650);
});

// Overnight shift 23:00-05:00 (noodle-shop style)
check('overnight shift', () => {
  const r = E.computeShift(
    {
      date: '2026-09-09',
      type: 'custom',
      scheduledStart: '23:00',
      scheduledEnd: '05:00',
      actualStart: '23:00',
      actualEnd: '05:00',
      rate: 1400,
    },
    BREAKS
  );
  assert.strictEqual(r.payableMinutes, 360);
  assert.strictEqual(r.lateMinutes, 0);
});

// One minute late is counted (exact minutes)
check('one minute late counts', () => {
  const r = E.computeShift(day('07:01', '16:00'), BREAKS);
  assert.strictEqual(r.lateMinutes, 1);
  assert.strictEqual(r.payableMinutes, 479);
});

// Salary period + payday (spec examples)
check('period Aug21-Sep20 payday Oct 10', () => {
  const p = E.getPeriod(2026, 9);
  assert.strictEqual(p.start, '2026-08-21');
  assert.strictEqual(p.end, '2026-09-20');
  assert.strictEqual(p.payday, '2026-10-10');
});
check('period Sep21-Oct20 payday Nov 10', () => {
  const p = E.periodForDate('2026-09-21');
  assert.strictEqual(p.start, '2026-09-21');
  assert.strictEqual(p.end, '2026-10-20');
  assert.strictEqual(p.payday, '2026-11-10');
  const p2 = E.periodForDate('2026-09-20');
  assert.strictEqual(p2.end, '2026-09-20');
});

// Japanese holidays 2026 — known real cases
check('2026 holidays incl. substitute + citizens holiday', () => {
  const h = H.holidaysForYear(2026, null);
  assert.strictEqual(h.get('2026-01-01').ja, '元日');
  assert.strictEqual(h.get('2026-01-12').ja, '成人の日');
  assert.strictEqual(h.get('2026-05-06').ja, '振替休日'); // May 3 2026 is a Sunday
  assert.strictEqual(h.get('2026-09-21').ja, '敬老の日');
  assert.strictEqual(h.get('2026-09-22').ja, '国民の休日'); // sandwiched day
  assert.strictEqual(h.get('2026-09-23').ja, '秋分の日');
  assert.strictEqual(h.get('2026-11-23').ja, '勤労感謝の日');
});

// Holiday override: remove and add
check('holiday overrides', () => {
  const h = H.holidaysForYear(2026, {
    '2026-11-23': { off: true },
    '2026-12-31': { name: 'Custom Day' },
  });
  assert.strictEqual(h.has('2026-11-23'), false);
  assert.strictEqual(h.get('2026-12-31').ja, 'Custom Day');
});

// Period summary split day/evening
check('summary totals', () => {
  const period = E.getPeriod(2026, 9);
  const shifts = [
    day('07:00', '16:00'),
    {
      date: '2026-09-07',
      type: 'evening',
      scheduledStart: '18:00',
      scheduledEnd: '22:45',
      actualStart: '18:00',
      actualEnd: '22:45',
      rate: 1400,
    },
  ];
  const s = E.summarize(shifts, BREAKS, period, new Set());
  assert.strictEqual(s.totals.gross, 10800 + 6650);
  assert.strictEqual(s.totals.dayEarnings, 10800);
  assert.strictEqual(s.totals.eveningEarnings, 6650);
  assert.strictEqual(s.totals.workingDays, 1);
});

console.log('\nAll ' + passed + ' tests passed.');
