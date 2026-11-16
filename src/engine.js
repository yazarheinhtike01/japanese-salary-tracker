/**
 * Salary calculation engine — pure JavaScript, no dependencies.
 * All calculations are EXACT minute-based. No 15/30-minute rounding anywhere.
 *
 * Rules implemented:
 * - Payable minutes = actual worked interval minus the parts that overlap
 *   unpaid breaks. Break overlaps are merged (union) before subtracting, so
 *   the same break can never be deducted twice.
 * - Late minutes   = actual start - scheduled start (only when positive).
 * - Early minutes  = scheduled end - actual end (only when positive).
 * - Earnings       = payable minutes x (hourly rate / 60), rounded to yen.
 * - Overnight shifts (end time <= start time) roll into the next day.
 * - Salary period  = 21st of previous month .. 20th of current month.
 * - Payday         = 10th of the following month.
 */

'use strict';

/* ---------------- time helpers ---------------- */

// 'HH:MM' -> minutes since midnight (0..1439). Returns null when invalid.
function parseTime(str) {
  if (typeof str !== 'string') return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(str.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function isValidTime(str) {
  return parseTime(str) !== null;
}

// minutes -> 'H:MM' display (hours may exceed 24 for totals)
function formatDuration(totalMinutes) {
  const sign = totalMinutes < 0 ? '-' : '';
  const abs = Math.abs(Math.round(totalMinutes));
  const h = Math.floor(abs / 60);
  const min = abs % 60;
  return sign + h + ':' + String(min).padStart(2, '0');
}

function formatYen(n) {
  return '¥' + Math.round(n).toLocaleString('en-US');
}

/* ---------------- date helpers (UTC based, no TZ drift) ---------------- */

const DAY_MS = 24 * 60 * 60 * 1000;

function dateToMs(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function msToDateStr(ms) {
  const dt = new Date(ms);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

function addDays(dateStr, n) {
  return msToDateStr(dateToMs(dateStr) + n * DAY_MS);
}

// 0 = Sunday .. 6 = Saturday
function weekdayOf(dateStr) {
  return new Date(dateToMs(dateStr)).getUTCDay();
}

/* ---------------- interval math ---------------- */

function overlapLen(aStart, aEnd, bStart, bEnd) {
  const s = Math.max(aStart, bStart);
  const e = Math.min(aEnd, bEnd);
  return e > s ? e - s : 0;
}

// total length of the union of [start, end] intervals (no double counting)
function unionLength(intervals) {
  if (!intervals.length) return 0;
  const sorted = intervals.slice().sort((a, b) => a[0] - b[0]);
  let total = 0;
  let curS = sorted[0][0];
  let curE = sorted[0][1];
  for (let i = 1; i < sorted.length; i++) {
    const [s, e] = sorted[i];
    if (s <= curE) {
      curE = Math.max(curE, e);
    } else {
      total += curE - curS;
      curS = s;
      curE = e;
    }
  }
  total += curE - curS;
  return total;
}

/* ---------------- shift calculation ---------------- */

/**
 * shift = {
 *   date: 'YYYY-MM-DD',
 *   type: 'day' | 'evening' | 'custom',
 *   scheduledStart: 'HH:MM', scheduledEnd: 'HH:MM',
 *   actualStart: 'HH:MM' | null, actualEnd: 'HH:MM' | null,
 *   rate: number (yen per hour)
 * }
 * breaks = [{ start: 'HH:MM', end: 'HH:MM' }, ...] unpaid break windows.
 *
 * Missing actual times fall back to the scheduled times (planned earnings),
 * and late/early are then 0.
 */
function computeShift(shift, breaks) {
  const dayBase = dateToMs(shift.date) / 60000; // absolute minutes of 00:00

  const schedStartT = parseTime(shift.scheduledStart);
  const schedEndT = parseTime(shift.scheduledEnd);
  if (schedStartT === null || schedEndT === null) {
    throw new Error('Invalid scheduled time for shift on ' + shift.date);
  }

  const hasActualStart = isValidTime(shift.actualStart);
  const hasActualEnd = isValidTime(shift.actualEnd);
  const actStartT = hasActualStart ? parseTime(shift.actualStart) : schedStartT;
  const actEndT = hasActualEnd ? parseTime(shift.actualEnd) : schedEndT;

  // absolute intervals; end <= start means the shift crosses midnight
  const schedStart = dayBase + schedStartT;
  let schedEnd = dayBase + schedEndT;
  if (schedEnd <= schedStart) schedEnd += 1440;

  const actStart = dayBase + actStartT;
  let actEnd = dayBase + actEndT;
  if (actEnd <= actStart) actEnd += 1440;

  // late / early — exact minutes, never negative
  let lateMinutes = 0;
  let earlyMinutes = 0;
  if (hasActualStart) {
    // an actual start shortly after midnight belongs to an overnight shift
    let a = actStart;
    if (a < schedStart - 720) a += 1440;
    lateMinutes = Math.max(0, a - schedStart);
  }
  if (hasActualEnd) {
    earlyMinutes = Math.max(0, schedEnd - actEnd);
  }

  // unpaid break overlap with the ACTUAL worked interval.
  // Breaks are clock-time windows; check the instance on the shift's start
  // date and the one on the following date (for overnight shifts).
  const breakIntervals = [];
  (breaks || []).forEach((b) => {
    const bs = parseTime(b.start);
    const be = parseTime(b.end);
    if (bs === null || be === null || be <= bs) return;
    [0, 1440].forEach((offset) => {
      const s = dayBase + offset + bs;
      const e = dayBase + offset + be;
      if (overlapLen(actStart, actEnd, s, e) > 0) breakIntervals.push([s, e]);
    });
  });
  // clamp break intervals to the worked interval, then union => no double deduction
  const clamped = breakIntervals.map(([s, e]) => [Math.max(s, actStart), Math.min(e, actEnd)]);
  const breakMinutes = unionLength(clamped);

  const grossMinutes = actEnd - actStart;
  const payableMinutes = Math.max(0, grossMinutes - breakMinutes);
  const earnings = Math.round(payableMinutes * (Number(shift.rate) / 60));

  return {
    grossMinutes,
    breakMinutes,
    payableMinutes,
    lateMinutes,
    earlyMinutes,
    earnings,
    hasActual: hasActualStart || hasActualEnd,
  };
}

/* ---------------- salary period ---------------- */

/**
 * The salary period that ENDS in (year, month):
 *   start  = 21st of the previous month
 *   end    = 20th of (year, month)
 *   payday = 10th of the month after (year, month)
 * Example: getPeriod(2026, 9) -> 2026-08-21 .. 2026-09-20, payday 2026-10-10.
 */
function getPeriod(year, month) {
  const endMs = Date.UTC(year, month - 1, 20);
  const startMs = Date.UTC(year, month - 2, 21);
  const paydayMs = Date.UTC(year, month, 10);
  return {
    start: msToDateStr(startMs),
    end: msToDateStr(endMs),
    payday: msToDateStr(paydayMs),
    year,
    month,
  };
}

// The period a given date belongs to: dates on/after the 21st belong to the
// period ending on the 20th of the NEXT month.
function periodForDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (d >= 21) {
    const nm = m === 12 ? 1 : m + 1;
    const ny = m === 12 ? y + 1 : y;
    return getPeriod(ny, nm);
  }
  return getPeriod(y, m);
}

/* ---------------- period summary ---------------- */

/**
 * Aggregate all shifts inside a period.
 * holidayDates = Set of 'YYYY-MM-DD' that are Sundays or public holidays
 * (holiday work is paid at the SAME rate — it is only reported separately).
 */
function summarize(shifts, breaks, period, holidayDates) {
  const inPeriod = (shifts || []).filter(
    (s) => s.date >= period.start && s.date <= period.end
  );

  const totals = {
    gross: 0,
    workingDays: 0,
    payableMinutes: 0,
    dayEarnings: 0,
    eveningEarnings: 0,
    customEarnings: 0,
    lateMinutes: 0,
    earlyMinutes: 0,
    breakMinutes: 0,
    holidayMinutes: 0,
    shiftCount: inPeriod.length,
  };

  const byDay = {}; // date -> { shifts: [enriched], earnings, payableMinutes }
  const workedDates = new Set();

  inPeriod.forEach((s) => {
    const r = computeShift(s, breaks);
    const enriched = Object.assign({}, s, { computed: r });
    if (!byDay[s.date]) byDay[s.date] = { shifts: [], earnings: 0, payableMinutes: 0 };
    byDay[s.date].shifts.push(enriched);
    byDay[s.date].earnings += r.earnings;
    byDay[s.date].payableMinutes += r.payableMinutes;

    totals.gross += r.earnings;
    totals.payableMinutes += r.payableMinutes;
    totals.lateMinutes += r.lateMinutes;
    totals.earlyMinutes += r.earlyMinutes;
    totals.breakMinutes += r.breakMinutes;
    if (s.type === 'day') totals.dayEarnings += r.earnings;
    else if (s.type === 'evening') totals.eveningEarnings += r.earnings;
    else totals.customEarnings += r.earnings;
    if (holidayDates && holidayDates.has(s.date)) {
      totals.holidayMinutes += r.payableMinutes;
    }
    if (r.payableMinutes > 0) workedDates.add(s.date);
  });

  totals.workingDays = workedDates.size;
  return { totals, byDay, shifts: inPeriod };
}

module.exports = {
  parseTime,
  isValidTime,
  formatDuration,
  formatYen,
  addDays,
  weekdayOf,
  dateToMs,
  msToDateStr,
  overlapLen,
  unionLength,
  computeShift,
  getPeriod,
  periodForDate,
  summarize,
};
