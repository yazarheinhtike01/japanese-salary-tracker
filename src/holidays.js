/**
 * Japanese national holidays (祝日) — generated from the official rules so any
 * year works without a network connection:
 *  - fixed-date holidays
 *  - "Happy Monday" holidays
 *  - spring / autumn equinox days (official approximation formula)
 *  - 振替休日 (substitute holiday when a holiday falls on a Sunday)
 *  - 国民の休日 (a weekday sandwiched between two holidays)
 *
 * User overrides are applied on top:
 *   overrides = {
 *     'YYYY-MM-DD': { off: true }              -> remove a holiday
 *                   { name: 'My holiday' }     -> add / rename a holiday
 *   }
 */

'use strict';

const DAY_MS = 24 * 60 * 60 * 1000;

function ds(y, m, d) {
  return (
    y +
    '-' +
    String(m).padStart(2, '0') +
    '-' +
    String(d).padStart(2, '0')
  );
}

function toMs(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromMs(ms) {
  const dt = new Date(ms);
  return ds(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

function weekday(dateStr) {
  return new Date(toMs(dateStr)).getUTCDay(); // 0 = Sunday
}

// day-of-month of the n-th Monday of (year, month)
function nthMonday(year, month, n) {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const firstMonday = 1 + ((8 - first) % 7);
  return firstMonday + (n - 1) * 7;
}

function springEquinoxDay(year) {
  return (
    Math.floor(20.8431 + 0.242194 * (year - 1980)) -
    Math.floor((year - 1980) / 4)
  );
}

function autumnEquinoxDay(year) {
  return (
    Math.floor(23.2488 + 0.242194 * (year - 1980)) -
    Math.floor((year - 1980) / 4)
  );
}

// Base holidays for one year: Map dateStr -> { ja, en }
function baseHolidays(year) {
  const map = new Map();
  const add = (m, d, ja, en) => map.set(ds(year, m, d), { ja, en });

  add(1, 1, '元日', "New Year's Day");
  map.set(ds(year, 1, nthMonday(year, 1, 2)), { ja: '成人の日', en: 'Coming of Age Day' });
  add(2, 11, '建国記念の日', 'National Foundation Day');
  if (year >= 2020) add(2, 23, '天皇誕生日', "The Emperor's Birthday");
  map.set(ds(year, 3, springEquinoxDay(year)), { ja: '春分の日', en: 'Vernal Equinox Day' });
  add(4, 29, '昭和の日', 'Shōwa Day');
  add(5, 3, '憲法記念日', 'Constitution Memorial Day');
  add(5, 4, 'みどりの日', 'Greenery Day');
  add(5, 5, 'こどもの日', "Children's Day");
  map.set(ds(year, 7, nthMonday(year, 7, 3)), { ja: '海の日', en: 'Marine Day' });
  if (year >= 2016) add(8, 11, '山の日', 'Mountain Day');
  map.set(ds(year, 9, nthMonday(year, 9, 3)), { ja: '敬老の日', en: 'Respect for the Aged Day' });
  map.set(ds(year, 9, autumnEquinoxDay(year)), { ja: '秋分の日', en: 'Autumnal Equinox Day' });
  map.set(ds(year, 10, nthMonday(year, 10, 2)), { ja: 'スポーツの日', en: 'Sports Day' });
  add(11, 3, '文化の日', 'Culture Day');
  add(11, 23, '勤労感謝の日', 'Labour Thanksgiving Day');

  // 振替休日 — holiday on Sunday -> next non-holiday weekday becomes a holiday
  const original = Array.from(map.keys());
  original.forEach((dateStr) => {
    if (weekday(dateStr) === 0) {
      let next = fromMs(toMs(dateStr) + DAY_MS);
      while (map.has(next)) next = fromMs(toMs(next) + DAY_MS);
      map.set(next, { ja: '振替休日', en: 'Substitute Holiday' });
    }
  });

  // 国民の休日 — a weekday between two holidays becomes a holiday
  const keys = Array.from(map.keys()).sort();
  keys.forEach((dateStr) => {
    const mid = fromMs(toMs(dateStr) + DAY_MS);
    const after = fromMs(toMs(dateStr) + 2 * DAY_MS);
    if (map.has(after) && !map.has(mid)) {
      const wd = weekday(mid);
      if (wd >= 1 && wd <= 5) {
        map.set(mid, { ja: '国民の休日', en: "Citizens' Holiday" });
      }
    }
  });

  return map;
}

/**
 * Holidays for a year with user overrides applied.
 * Returns Map dateStr -> { ja, en }.
 */
function holidaysForYear(year, overrides) {
  const map = baseHolidays(year);
  if (overrides) {
    Object.keys(overrides).forEach((dateStr) => {
      if (!dateStr.startsWith(String(year) + '-')) return;
      const o = overrides[dateStr];
      if (!o) return;
      if (o.off) map.delete(dateStr);
      else if (o.name) map.set(dateStr, { ja: o.name, en: o.name });
    });
  }
  return map;
}

// Set of red days (Sundays + holidays) for every date in [start, end].
function redDaySet(start, end, overrides) {
  const set = new Set();
  const years = new Set();
  let cur = start;
  while (cur <= end) {
    years.add(Number(cur.slice(0, 4)));
    if (weekday(cur) === 0) set.add(cur);
    cur = fromMs(toMs(cur) + DAY_MS);
  }
  years.forEach((y) => {
    holidaysForYear(y, overrides).forEach((_, dateStr) => {
      if (dateStr >= start && dateStr <= end) set.add(dateStr);
    });
  });
  return set;
}

module.exports = {
  holidaysForYear,
  redDaySet,
  weekday,
  ds,
};
