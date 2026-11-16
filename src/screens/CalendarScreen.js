'use strict';

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { BigButton, Card } from '../components';

const E = require('../engine');
const H = require('../holidays');

export const MONTH_NAMES = {
  my: ['ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်', 'ဇူလိုင်', 'ဩဂုတ်', 'စက်တင်', 'အောက်တို', 'နိုဝင်', 'ဒီဇင်'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
};

function todayStr() {
  const d = new Date();
  return (
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  );
}

export default function CalendarScreen({ state, c, t, lang, selectedDate, setSelectedDate, openEditor, applyTemplate }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const settings = state.settings;
  const holidays = H.holidaysForYear(year, settings.holidayOverrides);

  // earnings per date for cell markers
  const earnByDate = {};
  state.shifts.forEach((s) => {
    try {
      const r = E.computeShift(s, settings.breaks);
      earnByDate[s.date] = (earnByDate[s.date] || 0) + r.earnings;
    } catch (e) { /* skip broken record */ }
  });

  const firstWeekday = E.weekdayOf(E.msToDateStr(Date.UTC(year, month - 1, 1)));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const moveMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  };

  const wdKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayShifts = state.shifts.filter((s) => s.date === selectedDate);
  const selHoliday = holidays.get(selectedDate);
  const selSunday = E.weekdayOf(selectedDate) === 0;
  const today = todayStr();

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
      {/* month header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <TouchableOpacity onPress={() => moveMonth(-1)} style={{ backgroundColor: c.chipBg, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 14 }}>
          <Text style={{ color: c.ink, fontSize: 20, fontWeight: '900' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: c.ink, fontSize: 20, fontWeight: '900' }}>
          {year} ・ {MONTH_NAMES[lang] ? MONTH_NAMES[lang][month - 1] : month}
        </Text>
        <TouchableOpacity onPress={() => moveMonth(1)} style={{ backgroundColor: c.chipBg, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 14 }}>
          <Text style={{ color: c.ink, fontSize: 20, fontWeight: '900' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* weekday header */}
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {wdKeys.map((k, i) => (
          <View key={k} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: i === 0 ? c.red : c.sub, fontWeight: '800', fontSize: 13 }}>{t(k)}</Text>
          </View>
        ))}
      </View>

      {/* grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, idx) => {
          if (d === null) return <View key={'e' + idx} style={{ width: '14.28%', aspectRatio: 0.92 }} />;
          const dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0');
          const hol = holidays.get(dateStr);
          const isSun = idx % 7 === 0;
          const isRed = isSun || !!hol;
          const selected = dateStr === selectedDate;
          const isToday = dateStr === today;
          const earn = earnByDate[dateStr];
          return (
            <TouchableOpacity
              key={dateStr}
              onPress={() => setSelectedDate(dateStr)}
              activeOpacity={0.7}
              style={{
                width: '14.28%',
                aspectRatio: 0.92,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 13,
                backgroundColor: selected ? c.primary : 'transparent',
                borderWidth: isToday && !selected ? 2 : 0,
                borderColor: c.accent,
              }}
            >
              <Text style={{ color: selected ? c.primaryInk : isRed ? c.red : c.ink, fontWeight: '800', fontSize: 15.5 }}>{d}</Text>
              {hol ? (
                <Text numberOfLines={1} style={{ color: selected ? c.primaryInk : c.red, fontSize: 7.5, fontWeight: '700', paddingHorizontal: 1 }}>
                  {hol.ja}
                </Text>
              ) : earn ? (
                <Text style={{ color: selected ? c.primaryInk : c.accent, fontSize: 8.5, fontWeight: '800' }}>
                  ¥{Math.round(earn / 100) / 10}k
                </Text>
              ) : (
                <Text style={{ fontSize: 7.5 }}> </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <BigButton
        c={c}
        kind="ghost"
        title={t('applyTemplate')}
        style={{ marginTop: 12 }}
        onPress={() =>
          Alert.alert(t('applyTemplate') + '?', '', [
            { text: t('cancel'), style: 'cancel' },
            { text: t('save'), onPress: () => applyTemplate(year, month) },
          ])
        }
      />

      {/* selected day panel */}
      <Card c={c} style={{ marginTop: 16 }}>
        <Text style={{ color: c.ink, fontSize: 17, fontWeight: '900' }}>
          {selectedDate} {selectedDate === today ? '・' + t('today') : ''}
        </Text>
        {selHoliday || selSunday ? (
          <View style={{ backgroundColor: c.stampBg, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, marginTop: 8, alignSelf: 'flex-start' }}>
            <Text style={{ color: c.red, fontWeight: '800', fontSize: 13.5 }}>
              {selHoliday ? selHoliday.ja + ' (' + selHoliday.en + ')' : t('sun')} ・ {t('holiday')}
            </Text>
          </View>
        ) : null}

        {dayShifts.length === 0 ? (
          <Text style={{ color: c.sub, marginTop: 12, fontSize: 14.5 }}>{t('noShiftsDay')}</Text>
        ) : (
          dayShifts.map((s) => {
            let r = null;
            try { r = E.computeShift(s, settings.breaks); } catch (e) { r = null; }
            const icon = s.type === 'day' ? '☀' : s.type === 'evening' ? '☾' : '✦';
            const name = s.type === 'day' ? t('dayShift') : s.type === 'evening' ? t('eveningShift') : t('customShift');
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => openEditor(selectedDate, s)}
                activeOpacity={0.7}
                style={{ borderTopWidth: 1.5, borderTopColor: c.border, paddingVertical: 11, marginTop: 11 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: c.ink, fontWeight: '800', fontSize: 15.5 }}>{icon} {name}</Text>
                  <Text style={{ color: c.red, fontWeight: '900', fontSize: 16.5 }}>{r ? E.formatYen(r.earnings) : ''}</Text>
                </View>
                <Text style={{ color: c.sub, fontSize: 13.5, marginTop: 3 }}>
                  {t('scheduled')}: {s.scheduledStart}–{s.scheduledEnd}
                  {s.actualStart || s.actualEnd ? '  ・  ' + t('actual') + ': ' + (s.actualStart || '--:--') + '–' + (s.actualEnd || '--:--') : ''}
                </Text>
                {r && (r.lateMinutes > 0 || r.earlyMinutes > 0) ? (
                  <Text style={{ color: c.gold, fontSize: 13, fontWeight: '700', marginTop: 2 }}>
                    {r.lateMinutes > 0 ? t('late') + ' ' + r.lateMinutes + t('minutes') + '  ' : ''}
                    {r.earlyMinutes > 0 ? t('early') + ' ' + r.earlyMinutes + t('minutes') : ''}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })
        )}

        <BigButton c={c} title={'＋ ' + t('addShift')} style={{ marginTop: 14 }} onPress={() => openEditor(selectedDate, null)} />
      </Card>
    </ScrollView>
  );
}
