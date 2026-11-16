'use strict';

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Card, StatBox } from '../components';

const E = require('../engine');
const H = require('../holidays');

export default function DashboardScreen({ state, c, t }) {
  const nowPeriod = E.periodForDate(
    new Date().getFullYear() +
      '-' +
      String(new Date().getMonth() + 1).padStart(2, '0') +
      '-' +
      String(new Date().getDate()).padStart(2, '0')
  );
  const [cursor, setCursor] = useState({ year: nowPeriod.year, month: nowPeriod.month });
  const period = E.getPeriod(cursor.year, cursor.month);
  const settings = state.settings;

  const redDays = H.redDaySet(period.start, period.end, settings.holidayOverrides);
  const summary = E.summarize(state.shifts, settings.breaks, period, redDays);
  const tt = summary.totals;

  const move = (delta) => {
    let m = cursor.month + delta;
    let y = cursor.year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setCursor({ year: y, month: m });
  };

  const navBtn = (label, fn) => (
    <TouchableOpacity onPress={fn} style={{ backgroundColor: c.chipBg, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 14 }}>
      <Text style={{ color: c.ink, fontSize: 20, fontWeight: '900' }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        {navBtn('‹', () => move(-1))}
        <Text style={{ color: c.ink, fontSize: 16.5, fontWeight: '900' }}>
          {period.start} – {period.end}
        </Text>
        {navBtn('›', () => move(1))}
      </View>

      {/* stamp-style total card */}
      <View style={{ backgroundColor: c.card, borderColor: c.red, borderWidth: 2.5, borderRadius: 20, padding: 20, alignItems: 'center' }}>
        <Text style={{ color: c.sub, fontSize: 13.5, fontWeight: '800', letterSpacing: 1 }}>{t('totalGross').toUpperCase()}</Text>
        <Text style={{ color: c.red, fontSize: 42, fontWeight: '900', marginTop: 4 }}>{E.formatYen(tt.gross)}</Text>
        <View style={{ backgroundColor: c.stampBg, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14, marginTop: 10 }}>
          <Text style={{ color: c.red, fontWeight: '800', fontSize: 14.5 }}>
            {t('payday')}: {period.payday}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 14 }}>
        <StatBox c={c} label={t('workingDays')} value={tt.workingDays + ' ' + t('days')} />
        <StatBox c={c} label={t('workingHours')} value={E.formatDuration(tt.payableMinutes)} />
        <StatBox c={c} label={t('dayEarnings')} value={E.formatYen(tt.dayEarnings)} accent={c.gold} />
        <StatBox c={c} label={t('eveningEarnings')} value={E.formatYen(tt.eveningEarnings)} accent={c.primary} />
        <StatBox c={c} label={t('totalLate')} value={tt.lateMinutes + ' ' + t('minutes')} accent={tt.lateMinutes ? c.gold : undefined} />
        <StatBox c={c} label={t('totalEarly')} value={tt.earlyMinutes + ' ' + t('minutes')} accent={tt.earlyMinutes ? c.gold : undefined} />
        <StatBox c={c} label={t('breakHours')} value={E.formatDuration(tt.breakMinutes)} />
        <StatBox c={c} label={t('holidayHours')} value={E.formatDuration(tt.holidayMinutes)} accent={c.red} />
      </View>

      <Card c={c} style={{ marginTop: 4 }}>
        <Text style={{ color: c.sub, fontSize: 13.5, fontWeight: '600' }}>※ {t('noteHolidaySameRate')}</Text>
      </Card>
    </ScrollView>
  );
}
