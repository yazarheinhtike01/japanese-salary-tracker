'use strict';

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { loadState, saveState, defaultState, newId } from './src/store';
import { getTheme } from './src/theme';
import { makeT } from './src/i18n';
import CalendarScreen from './src/screens/CalendarScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ShiftEditor from './src/screens/ShiftEditor';

const E = require('./src/engine');

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export default function App() {
  const [state, setState] = useState(null);
  const [tab, setTab] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [editor, setEditor] = useState({ visible: false, date: todayStr(), shift: null });

  useEffect(() => {
    loadState().then(setState);
  }, []);

  const update = (next) => {
    setState(next);
    saveState(next);
  };

  if (!state) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F2E9' }}>
        <ActivityIndicator size="large" color="#E4572E" />
      </View>
    );
  }

  const settings = state.settings;
  const c = getTheme(settings.dark);
  const t = makeT(settings.language);

  const updateSettings = (patch) => {
    update(Object.assign({}, state, { settings: Object.assign({}, settings, patch) }));
  };

  const openEditor = (date, shift) => setEditor({ visible: true, date, shift });
  const closeEditor = () => setEditor((e) => Object.assign({}, e, { visible: false }));

  const saveShift = (draft) => {
    let shifts;
    if (draft.id) {
      shifts = state.shifts.map((s) => (s.id === draft.id ? draft : s));
    } else {
      shifts = state.shifts.concat([Object.assign({}, draft, { id: newId() })]);
    }
    update(Object.assign({}, state, { shifts }));
    closeEditor();
  };

  const deleteShift = (id) => {
    update(Object.assign({}, state, { shifts: state.shifts.filter((s) => s.id !== id) }));
    closeEditor();
  };

  // Fill a whole calendar month from the weekly template.
  // Days that already have any shift are left untouched.
  const applyTemplate = (year, month) => {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const existing = new Set(state.shifts.map((s) => s.date));
    const added = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      if (existing.has(dateStr)) continue;
      const tpl = settings.weekly[E.weekdayOf(dateStr)];
      if (!tpl) continue;
      added.push({
        id: newId(),
        date: dateStr,
        type: tpl.type,
        scheduledStart: tpl.start,
        scheduledEnd: tpl.end,
        actualStart: null,
        actualEnd: null,
        rate: tpl.type === 'evening' ? settings.eveningRate : settings.dayRate,
      });
    }
    if (added.length) update(Object.assign({}, state, { shifts: state.shifts.concat(added) }));
  };

  const TABS = [
    { key: 'calendar', icon: '▦', label: t('calendar') },
    { key: 'dashboard', icon: '◈', label: t('dashboard') },
    { key: 'history', icon: '☰', label: t('history') },
    { key: 'settings', icon: '⚙', label: t('settings') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={settings.dark ? 'light' : 'dark'} />

      {/* header with hanko-style logo block */}
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 11,
          paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16,
          backgroundColor: c.bg,
        }}
      >
        <View style={{ backgroundColor: c.red, width: 38, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 21, fontWeight: '900' }}>¥</Text>
        </View>
        <Text style={{ color: c.ink, fontSize: 21, fontWeight: '900' }}>{t('appName')}</Text>
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'calendar' && (
          <CalendarScreen
            state={state} c={c} t={t} lang={settings.language}
            selectedDate={selectedDate} setSelectedDate={setSelectedDate}
            openEditor={openEditor} applyTemplate={applyTemplate}
          />
        )}
        {tab === 'dashboard' && <DashboardScreen state={state} c={c} t={t} />}
        {tab === 'history' && <HistoryScreen state={state} c={c} t={t} openEditor={openEditor} />}
        {tab === 'settings' && <SettingsScreen state={state} c={c} t={t} updateSettings={updateSettings} />}
      </View>

      {/* custom bottom bar with raised centre add-button */}
      <View
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          backgroundColor: c.tabBar, borderTopWidth: 1.5, borderTopColor: c.border,
          flexDirection: 'row', paddingBottom: 20, paddingTop: 8,
        }}
      >
        {TABS.slice(0, 2).map((tb) => (
          <TabButton key={tb.key} tb={tb} active={tab === tb.key} c={c} onPress={() => setTab(tb.key)} />
        ))}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => openEditor(selectedDate, null)}
            activeOpacity={0.8}
            style={{
              backgroundColor: c.accent, width: 54, height: 54, borderRadius: 27,
              alignItems: 'center', justifyContent: 'center', marginTop: -26,
              borderWidth: 3.5, borderColor: c.tabBar,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: -3 }}>+</Text>
          </TouchableOpacity>
        </View>
        {TABS.slice(2).map((tb) => (
          <TabButton key={tb.key} tb={tb} active={tab === tb.key} c={c} onPress={() => setTab(tb.key)} />
        ))}
      </View>

      <ShiftEditor
        visible={editor.visible}
        date={editor.date}
        shift={editor.shift}
        settings={settings}
        c={c}
        t={t}
        onSave={saveShift}
        onDelete={deleteShift}
        onClose={closeEditor}
      />
    </View>
  );
}

function TabButton({ tb, active, c, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flex: 1, alignItems: 'center', paddingTop: 2 }}>
      <Text style={{ fontSize: 21, color: active ? c.accent : c.tabInactive }}>{tb.icon}</Text>
      <Text style={{ fontSize: 10.5, fontWeight: '800', color: active ? c.accent : c.tabInactive, marginTop: 1 }}>{tb.label}</Text>
    </TouchableOpacity>
  );
}
