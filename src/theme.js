/**
 * Original design system — "pay slip & hanko stamp" look.
 * Warm paper / deep ink navy / vermillion accent. Chunky rounded buttons,
 * stamp-red highlights for holidays and the main total. No gradients.
 */
'use strict';

const LIGHT = {
  bg: '#F7F2E9',
  card: '#FFFFFF',
  cardAlt: '#FBF8F1',
  ink: '#1C2B3A',
  sub: '#68727E',
  border: '#E4DCCB',
  primary: '#173F5F',
  primaryInk: '#FFFFFF',
  accent: '#E4572E', // vermillion (shu-iro)
  accentInk: '#FFFFFF',
  red: '#C93A2E', // Sundays & holidays
  gold: '#A97E10',
  green: '#2E7D5B',
  tabBar: '#FFFFFF',
  tabInactive: '#9AA3AD',
  chipBg: '#EFE9DB',
  inputBg: '#FFFFFF',
  stampBg: '#FDECEA',
};

const DARK = {
  bg: '#0D1520',
  card: '#17242F',
  cardAlt: '#1B2A38',
  ink: '#EDF1F5',
  sub: '#93A3B1',
  border: '#2A3B4C',
  primary: '#7FB2E0',
  primaryInk: '#0D1520',
  accent: '#F0663A',
  accentInk: '#FFFFFF',
  red: '#F0766B',
  gold: '#D9A92C',
  green: '#4CB08A',
  tabBar: '#131F2B',
  tabInactive: '#5F7185',
  chipBg: '#22344A',
  inputBg: '#101C28',
  stampBg: '#3A2320',
};

function getTheme(dark) {
  return dark ? DARK : LIGHT;
}

module.exports = { getTheme, LIGHT, DARK };
