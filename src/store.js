/**
 * Persistent local storage (AsyncStorage). All data stays on the phone;
 * nothing is uploaded anywhere. Data survives closing the app.
 */
'use strict';

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'salary-tracker-v1';

export function defaultSettings() {
  return {
    language: 'my', // 'my' | 'en' | 'ja'
    dark: false,
    dayRate: 1350,
    eveningRate: 1400,
    breaks: [
      { start: '12:00', end: '13:00' },
      { start: '17:00', end: '18:00' },
    ],
    // Weekly template, index 0 = Sunday .. 6 = Saturday.
    // Prefilled with a typical cleaning-job pattern; fully editable.
    weekly: [
      { type: 'day', start: '07:00', end: '16:00' }, // Sun
      { type: 'evening', start: '18:00', end: '22:45' }, // Mon
      { type: 'evening', start: '18:00', end: '22:45' }, // Tue
      { type: 'evening', start: '18:00', end: '22:45' }, // Wed
      { type: 'evening', start: '18:00', end: '22:45' }, // Thu
      { type: 'evening', start: '18:00', end: '22:45' }, // Fri
      null, // Sat off
    ],
    holidayOverrides: {}, // 'YYYY-MM-DD' -> { off: true } | { name: string }
  };
}

export function defaultState() {
  return { settings: defaultSettings(), shifts: [] };
}

export async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const state = defaultState();
    state.settings = Object.assign(state.settings, parsed.settings || {});
    state.shifts = Array.isArray(parsed.shifts) ? parsed.shifts : [];
    return state;
  } catch (e) {
    return defaultState();
  }
}

export async function saveState(state) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // storage full / unavailable: keep the app running; data stays in memory
  }
}

let counter = 0;
export function newId() {
  counter += 1;
  return 's' + Date.now().toString(36) + '-' + counter + '-' + Math.floor(Math.random() * 1e6).toString(36);
}
