/**
 * Report builders — pure functions (unit-testable).
 * The screens hand the results to expo-print (PDF) and
 * expo-file-system + expo-sharing (CSV).
 */
'use strict';

const E = require('./engine');

function typeLabel(type, t) {
  if (type === 'day') return t('dayShift');
  if (type === 'evening') return t('eveningShift');
  return t('customShift');
}

function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/**
 * summary = result of engine.summarize()
 * holidayNames = Map dateStr -> name (Japanese) for the holiday column
 */
function buildCsv(summary, period, t, holidayNames) {
  const header = [
    t('date'), t('type'), t('scheduled') + ' ' + t('start'), t('scheduled') + ' ' + t('end'),
    t('clockIn'), t('clockOut'), t('payableTime'), t('breakDeducted'),
    t('late'), t('early'), t('rate'), t('earnings'), t('holiday'),
  ];
  const lines = [header.map(csvEscape).join(',')];
  const dates = Object.keys(summary.byDay).sort();
  dates.forEach((date) => {
    summary.byDay[date].shifts.forEach((s) => {
      const c = s.computed;
      lines.push(
        [
          date,
          typeLabel(s.type, t),
          s.scheduledStart,
          s.scheduledEnd,
          s.actualStart || '',
          s.actualEnd || '',
          E.formatDuration(c.payableMinutes),
          E.formatDuration(c.breakMinutes),
          c.lateMinutes,
          c.earlyMinutes,
          s.rate,
          c.earnings,
          holidayNames && holidayNames.get(date) ? holidayNames.get(date) : '',
        ]
          .map(csvEscape)
          .join(',')
      );
    });
  });
  const tt = summary.totals;
  lines.push('');
  lines.push([t('period'), period.start + ' - ' + period.end].map(csvEscape).join(','));
  lines.push([t('payday'), period.payday].map(csvEscape).join(','));
  lines.push([t('totalGross'), tt.gross].map(csvEscape).join(','));
  lines.push([t('workingDays'), tt.workingDays].map(csvEscape).join(','));
  lines.push([t('workingHours'), E.formatDuration(tt.payableMinutes)].map(csvEscape).join(','));
  lines.push([t('dayEarnings'), tt.dayEarnings].map(csvEscape).join(','));
  lines.push([t('eveningEarnings'), tt.eveningEarnings].map(csvEscape).join(','));
  lines.push([t('totalLate'), tt.lateMinutes].map(csvEscape).join(','));
  lines.push([t('totalEarly'), tt.earlyMinutes].map(csvEscape).join(','));
  // BOM so Excel opens the UTF-8 file correctly
  return '﻿' + lines.join('\n');
}

function buildPdfHtml(summary, period, t, holidayNames) {
  const tt = summary.totals;
  const dates = Object.keys(summary.byDay).sort();
  const rows = [];
  dates.forEach((date) => {
    summary.byDay[date].shifts.forEach((s) => {
      const c = s.computed;
      const hol = holidayNames && holidayNames.get(date) ? holidayNames.get(date) : '';
      rows.push(
        '<tr>' +
          '<td>' + date + (hol ? ' <span class="hol">' + hol + '</span>' : '') + '</td>' +
          '<td>' + typeLabel(s.type, t) + '</td>' +
          '<td>' + s.scheduledStart + '-' + s.scheduledEnd + '</td>' +
          '<td>' + (s.actualStart || '-') + '-' + (s.actualEnd || '-') + '</td>' +
          '<td>' + E.formatDuration(c.payableMinutes) + '</td>' +
          '<td>' + c.lateMinutes + '</td>' +
          '<td>' + c.earlyMinutes + '</td>' +
          '<td class="yen">¥' + c.earnings.toLocaleString('en-US') + '</td>' +
          '</tr>'
      );
    });
  });
  const stat = (label, value) =>
    '<div class="stat"><div class="slabel">' + label + '</div><div class="svalue">' + value + '</div></div>';

  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
    'body{font-family:-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif;color:#1C2B3A;margin:32px;}' +
    'h1{font-size:22px;border-bottom:3px solid #E4572E;padding-bottom:8px;}' +
    '.meta{color:#68727E;margin:6px 0 18px;}' +
    'table{width:100%;border-collapse:collapse;font-size:12px;}' +
    'th{background:#173F5F;color:#fff;padding:6px;text-align:left;}' +
    'td{border-bottom:1px solid #E4DCCB;padding:6px;}' +
    '.yen{text-align:right;font-weight:700;}' +
    '.hol{color:#C93A2E;font-size:10px;}' +
    '.stats{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px;}' +
    '.stat{border:1.5px solid #173F5F;border-radius:10px;padding:10px 14px;min-width:130px;}' +
    '.slabel{font-size:11px;color:#68727E;}' +
    '.svalue{font-size:17px;font-weight:800;margin-top:2px;}' +
    '.total{font-size:26px;font-weight:900;color:#C93A2E;margin-top:22px;}' +
    '</style></head><body>' +
    '<h1>' + t('appName') + ' — ' + t('period') + '</h1>' +
    '<div class="meta">' + period.start + ' – ' + period.end + ' ／ ' + t('payday') + ': ' + period.payday + '</div>' +
    '<table><tr><th>' + t('date') + '</th><th>' + t('type') + '</th><th>' + t('scheduled') + '</th><th>' + t('actual') + '</th><th>' + t('payableTime') + '</th><th>' + t('late') + '</th><th>' + t('early') + '</th><th style="text-align:right">' + t('earnings') + '</th></tr>' +
    rows.join('') +
    '</table>' +
    '<div class="stats">' +
    stat(t('workingDays'), tt.workingDays + ' ' + t('days')) +
    stat(t('workingHours'), E.formatDuration(tt.payableMinutes)) +
    stat(t('dayEarnings'), '¥' + tt.dayEarnings.toLocaleString('en-US')) +
    stat(t('eveningEarnings'), '¥' + tt.eveningEarnings.toLocaleString('en-US')) +
    stat(t('totalLate'), tt.lateMinutes + ' ' + t('minutes')) +
    stat(t('totalEarly'), tt.earlyMinutes + ' ' + t('minutes')) +
    stat(t('breakHours'), E.formatDuration(tt.breakMinutes)) +
    stat(t('holidayHours'), E.formatDuration(tt.holidayMinutes)) +
    '</div>' +
    '<div class="total">' + t('totalGross') + ': ¥' + tt.gross.toLocaleString('en-US') + '</div>' +
    '</body></html>'
  );
}

module.exports = { buildCsv, buildPdfHtml, typeLabel };
