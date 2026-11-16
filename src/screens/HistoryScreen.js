'use strict';

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { BigButton, Card } from '../components';

const E = require('../engine');
const H = require('../holidays');
const X = require('../export');

function periodKey(p) {
  return p.year + '-' + p.month;
}

function holidayNameMap(period, overrides) {
  const map = new Map();
  const years = [Number(period.start.slice(0, 4)), Number(period.end.slice(0, 4))];
  Array.from(new Set(years)).forEach((y) => {
    H.holidaysForYear(y, overrides).forEach((v, k) => map.set(k, v.ja));
  });
  return map;
}

export default function HistoryScreen({ state, c, t, openEditor }) {
  const settings = state.settings;
  const [detailKey, setDetailKey] = useState(null);

  // every period that has at least one shift
  const periodMap = new Map();
  state.shifts.forEach((s) => {
    const p = E.periodForDate(s.date);
    periodMap.set(periodKey(p), p);
  });
  const periods = Array.from(periodMap.values()).sort((a, b) => (a.end < b.end ? 1 : -1));

  const summarizePeriod = (p) => {
    const red = H.redDaySet(p.start, p.end, settings.holidayOverrides);
    return E.summarize(state.shifts, settings.breaks, p, red);
  };

  const exportCsv = async (p, summary) => {
    try {
      const csv = X.buildCsv(summary, p, t, holidayNameMap(p, settings.holidayOverrides));
      const uri = FileSystem.cacheDirectory + 'salary-' + p.year + '-' + String(p.month).padStart(2, '0') + '.csv';
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(uri, { mimeType: 'text/csv' });
    } catch (e) {
      Alert.alert('CSV', String(e && e.message ? e.message : e));
    }
  };

  const exportPdf = async (p, summary) => {
    try {
      const html = X.buildPdfHtml(summary, p, t, holidayNameMap(p, settings.holidayOverrides));
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
    } catch (e) {
      Alert.alert('PDF', String(e && e.message ? e.message : e));
    }
  };

  if (detailKey) {
    const p = periodMap.get(detailKey);
    if (!p) {
      setDetailKey(null);
      return null;
    }
    const summary = summarizePeriod(p);
    const tt = summary.totals;
    const dates = Object.keys(summary.byDay).sort();
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        <TouchableOpacity onPress={() => setDetailKey(null)} style={{ marginBottom: 10 }}>
          <Text style={{ color: c.primary, fontSize: 16, fontWeight: '800' }}>‹ {t('back')}</Text>
        </TouchableOpacity>
        <Text style={{ color: c.ink, fontSize: 18, fontWeight: '900' }}>
          {p.start} – {p.end}
        </Text>
        <Text style={{ color: c.sub, fontWeight: '700', marginTop: 2 }}>
          {t('payday')}: {p.payday} ・ {t('totalGross')}: <Text style={{ color: c.red, fontWeight: '900' }}>{E.formatYen(tt.gross)}</Text>
        </Text>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <BigButton c={c} title={t('exportPdf')} style={{ flex: 1 }} onPress={() => exportPdf(p, summary)} />
          <BigButton c={c} title={t('exportCsv')} kind="ghost" style={{ flex: 1 }} onPress={() => exportCsv(p, summary)} />
        </View>

        {dates.map((date) => (
          <Card c={c} key={date} style={{ marginTop: 12, paddingVertical: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: c.ink, fontWeight: '900', fontSize: 15 }}>{date}</Text>
              <Text style={{ color: c.red, fontWeight: '900' }}>{E.formatYen(summary.byDay[date].earnings)}</Text>
            </View>
            {summary.byDay[date].shifts.map((s) => (
              <TouchableOpacity key={s.id} onPress={() => openEditor(date, s)} activeOpacity={0.7}>
                <Text style={{ color: c.sub, fontSize: 13.5, marginTop: 5 }}>
                  {s.type === 'day' ? '☀' : s.type === 'evening' ? '☾' : '✦'} {s.scheduledStart}–{s.scheduledEnd}
                  {s.actualStart || s.actualEnd ? ' → ' + (s.actualStart || '--:--') + '–' + (s.actualEnd || '--:--') : ''}
                  {'  ・  '}{E.formatDuration(s.computed.payableMinutes)}{'  ・  '}{E.formatYen(s.computed.earnings)}
                </Text>
              </TouchableOpacity>
            ))}
          </Card>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
      {periods.length === 0 ? (
        <Text style={{ color: c.sub, fontSize: 15, marginTop: 20 }}>{t('noRecords')}</Text>
      ) : (
        periods.map((p) => {
          const s = summarizePeriod(p);
          return (
            <TouchableOpacity key={periodKey(p)} onPress={() => setDetailKey(periodKey(p))} activeOpacity={0.75}>
              <Card c={c} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ color: c.ink, fontWeight: '900', fontSize: 16 }}>
                      {p.start} – {p.end}
                    </Text>
                    <Text style={{ color: c.sub, fontSize: 13.5, fontWeight: '600', marginTop: 3 }}>
                      {t('payday')}: {p.payday} ・ {s.totals.workingDays} {t('days')}
                    </Text>
                  </View>
                  <Text style={{ color: c.red, fontWeight: '900', fontSize: 19 }}>{E.formatYen(s.totals.gross)}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}
