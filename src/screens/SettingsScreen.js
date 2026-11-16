'use strict';

import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { BigButton, Card, Chip, SectionTitle } from '../components';

const E = require('../engine');

function SmallTime({ c, value, onChange }) {
  return (
    <TextInput
      value={value || ''}
      onChangeText={(txt) => onChange(txt.replace(/[^0-9:]/g, '').slice(0, 5))}
      placeholder="--:--"
      placeholderTextColor={c.tabInactive}
      keyboardType="numbers-and-punctuation"
      style={{
        backgroundColor: c.inputBg, borderColor: c.border, borderWidth: 2, borderRadius: 10,
        color: c.ink, fontSize: 16, fontWeight: '800', paddingVertical: 6, paddingHorizontal: 8,
        textAlign: 'center', width: 84,
      }}
    />
  );
}

function NumField({ c, value, onChange }) {
  return (
    <TextInput
      value={String(value)}
      onChangeText={(txt) => onChange(Number(txt.replace(/[^0-9]/g, '')) || 0)}
      keyboardType="number-pad"
      style={{
        backgroundColor: c.inputBg, borderColor: c.border, borderWidth: 2, borderRadius: 12,
        color: c.ink, fontSize: 19, fontWeight: '800', paddingVertical: 8, paddingHorizontal: 12,
        textAlign: 'center', width: 130,
      }}
    />
  );
}

export default function SettingsScreen({ state, c, t, updateSettings }) {
  const s = state.settings;
  const [holDate, setHolDate] = useState('');
  const [holName, setHolName] = useState('');

  const wdKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const typeColor = (tp) => (tp === 'day' ? c.gold : tp === 'evening' ? c.primary : c.green);

  const setWeekly = (idx, val) => {
    const weekly = s.weekly.slice();
    weekly[idx] = val;
    updateSettings({ weekly });
  };

  const setBreak = (idx, patch) => {
    const breaks = s.breaks.slice();
    breaks[idx] = Object.assign({}, breaks[idx], patch);
    updateSettings({ breaks });
  };

  const overrideKeys = Object.keys(s.holidayOverrides).sort();

  const applyOverride = (val) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(holDate)) return;
    const holidayOverrides = Object.assign({}, s.holidayOverrides);
    holidayOverrides[holDate] = val;
    updateSettings({ holidayOverrides });
    setHolDate('');
    setHolName('');
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
      <SectionTitle c={c}>{t('language')}</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Chip c={c} label="မြန်မာ" selected={s.language === 'my'} onPress={() => updateSettings({ language: 'my' })} />
        <Chip c={c} label="English" selected={s.language === 'en'} onPress={() => updateSettings({ language: 'en' })} />
        <Chip c={c} label="日本語" selected={s.language === 'ja'} onPress={() => updateSettings({ language: 'ja' })} />
      </View>

      <SectionTitle c={c}>{t('theme')}</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Chip c={c} label={'☀ ' + t('light')} selected={!s.dark} onPress={() => updateSettings({ dark: false })} />
        <Chip c={c} label={'☾ ' + t('dark')} selected={s.dark} onPress={() => updateSettings({ dark: true })} />
      </View>

      <SectionTitle c={c}>{t('rates')}</SectionTitle>
      <Card c={c}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: c.ink, fontWeight: '700', fontSize: 15 }}>☀ {t('dayRate')}</Text>
          <NumField c={c} value={s.dayRate} onChange={(v) => updateSettings({ dayRate: v })} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: c.ink, fontWeight: '700', fontSize: 15 }}>☾ {t('eveningRate')}</Text>
          <NumField c={c} value={s.eveningRate} onChange={(v) => updateSettings({ eveningRate: v })} />
        </View>
      </Card>

      <SectionTitle c={c}>{t('breaks')}</SectionTitle>
      <Card c={c}>
        {s.breaks.map((b, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
            <SmallTime c={c} value={b.start} onChange={(v) => setBreak(i, { start: v })} />
            <Text style={{ color: c.sub, fontWeight: '800' }}>–</Text>
            <SmallTime c={c} value={b.end} onChange={(v) => setBreak(i, { end: v })} />
            <TouchableOpacity
              onPress={() => updateSettings({ breaks: s.breaks.filter((_, j) => j !== i) })}
              style={{ marginLeft: 'auto', backgroundColor: c.stampBg, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12 }}
            >
              <Text style={{ color: c.red, fontWeight: '800' }}>{t('delete')}</Text>
            </TouchableOpacity>
          </View>
        ))}
        <BigButton
          c={c}
          kind="ghost"
          title={'＋ ' + t('breaks')}
          onPress={() => updateSettings({ breaks: s.breaks.concat([{ start: '12:00', end: '13:00' }]) })}
        />
      </Card>

      <SectionTitle c={c}>{t('weeklySchedule')}</SectionTitle>
      <Card c={c}>
        {wdKeys.map((k, idx) => {
          const w = s.weekly[idx];
          return (
            <View key={k} style={{ borderBottomWidth: idx < 6 ? 1 : 0, borderBottomColor: c.border, paddingVertical: 9 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                <Text style={{ color: idx === 0 ? c.red : c.ink, fontWeight: '900', fontSize: 15, width: 62 }}>{t(k)}</Text>
                <Chip c={c} label={t('off')} selected={!w} onPress={() => setWeekly(idx, null)} />
                <Chip c={c} label={t('dayShift')} selected={!!w && w.type === 'day'} color={typeColor('day')}
                  onPress={() => setWeekly(idx, { type: 'day', start: '07:00', end: '16:00' })} />
                <Chip c={c} label={t('eveningShift')} selected={!!w && w.type === 'evening'} color={typeColor('evening')}
                  onPress={() => setWeekly(idx, { type: 'evening', start: '18:00', end: '22:45' })} />
              </View>
              {w ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginLeft: 62 }}>
                  <SmallTime c={c} value={w.start} onChange={(v) => setWeekly(idx, Object.assign({}, w, { start: v }))} />
                  <Text style={{ color: c.sub, fontWeight: '800' }}>–</Text>
                  <SmallTime c={c} value={w.end} onChange={(v) => setWeekly(idx, Object.assign({}, w, { end: v }))} />
                </View>
              ) : null}
            </View>
          );
        })}
      </Card>

      <SectionTitle c={c}>{t('holidayCustom')}</SectionTitle>
      <Card c={c}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          <TextInput
            value={holDate}
            onChangeText={(txt) => setHolDate(txt.replace(/[^0-9-]/g, '').slice(0, 10))}
            placeholder="2026-12-31"
            placeholderTextColor={c.tabInactive}
            keyboardType="numbers-and-punctuation"
            style={{ flex: 1, backgroundColor: c.inputBg, borderColor: c.border, borderWidth: 2, borderRadius: 10, color: c.ink, fontSize: 16, fontWeight: '700', paddingVertical: 8, paddingHorizontal: 10 }}
          />
          <TextInput
            value={holName}
            onChangeText={setHolName}
            placeholder={t('holiday')}
            placeholderTextColor={c.tabInactive}
            style={{ flex: 1, backgroundColor: c.inputBg, borderColor: c.border, borderWidth: 2, borderRadius: 10, color: c.ink, fontSize: 16, fontWeight: '700', paddingVertical: 8, paddingHorizontal: 10 }}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <BigButton c={c} title={t('addHoliday')} style={{ flex: 1 }} onPress={() => holName && applyOverride({ name: holName })} />
          <BigButton c={c} title={t('removeHoliday')} kind="ghost" style={{ flex: 1 }} onPress={() => applyOverride({ off: true })} />
        </View>
        {overrideKeys.map((k) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <Text style={{ color: c.ink, fontWeight: '700' }}>
              {k} — {s.holidayOverrides[k].off ? t('removeHoliday') : s.holidayOverrides[k].name}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const holidayOverrides = Object.assign({}, s.holidayOverrides);
                delete holidayOverrides[k];
                updateSettings({ holidayOverrides });
              }}
            >
              <Text style={{ color: c.red, fontWeight: '900', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Card>

      <Text style={{ color: c.sub, fontSize: 12.5, marginTop: 18, textAlign: 'center' }}>
        {t('appName')} v1.0 — data stays on this phone only.
      </Text>
    </ScrollView>
  );
}
