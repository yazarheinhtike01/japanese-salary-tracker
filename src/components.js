'use strict';

import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';

/* Chunky, stamp-inspired shared UI. Big tap targets, thick borders,
   no gradients, no purple — a pay-slip look of its own. */

export function Card({ c, children, style }) {
  return (
    <View
      style={[
        { backgroundColor: c.card, borderColor: c.border, borderWidth: 1.5, borderRadius: 18, padding: 16 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ c, children }) {
  return (
    <Text style={{ color: c.ink, fontSize: 16, fontWeight: '800', marginTop: 20, marginBottom: 10 }}>
      {children}
    </Text>
  );
}

export function BigButton({ c, title, onPress, kind, style }) {
  const bg = kind === 'ghost' ? 'transparent' : kind === 'danger' ? c.red : c.accent;
  const fg = kind === 'ghost' ? c.primary : '#FFFFFF';
  const border = kind === 'ghost' ? c.primary : bg;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: 2,
          borderRadius: 16,
          paddingVertical: 13,
          paddingHorizontal: 18,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text style={{ color: fg, fontSize: 16, fontWeight: '800' }}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Chip({ c, label, selected, onPress, color }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        borderWidth: 2,
        borderColor: selected ? color || c.accent : c.border,
        backgroundColor: selected ? color || c.accent : c.chipBg,
        borderRadius: 999,
        paddingVertical: 7,
        paddingHorizontal: 14,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ color: selected ? '#FFFFFF' : c.ink, fontWeight: '700', fontSize: 14 }}>{label}</Text>
    </TouchableOpacity>
  );
}

const QUICK_TIMES = ['07:00', '12:00', '13:00', '16:00', '17:00', '18:00', '22:00', '22:45', '23:00', '05:00'];

export function TimeField({ c, label, value, onChange, allowEmpty }) {
  return (
    <View style={{ marginBottom: 12, flex: 1 }}>
      <Text style={{ color: c.sub, fontSize: 13, fontWeight: '700', marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value || ''}
        onChangeText={(txt) => onChange(txt.replace(/[^0-9:]/g, '').slice(0, 5))}
        placeholder="--:--"
        placeholderTextColor={c.tabInactive}
        keyboardType="numbers-and-punctuation"
        style={{
          backgroundColor: c.inputBg,
          borderColor: c.border,
          borderWidth: 2,
          borderRadius: 12,
          color: c.ink,
          fontSize: 20,
          fontWeight: '800',
          paddingVertical: 9,
          paddingHorizontal: 12,
          textAlign: 'center',
        }}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
        {QUICK_TIMES.slice(0, 5).map((q) => (
          <TouchableOpacity
            key={q}
            onPress={() => onChange(q)}
            style={{ backgroundColor: c.chipBg, borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8, marginRight: 5, marginBottom: 5 }}
          >
            <Text style={{ color: c.ink, fontSize: 12, fontWeight: '600' }}>{q}</Text>
          </TouchableOpacity>
        ))}
        {allowEmpty ? (
          <TouchableOpacity
            onPress={() => onChange('')}
            style={{ backgroundColor: c.chipBg, borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8, marginBottom: 5 }}
          >
            <Text style={{ color: c.red, fontSize: 12, fontWeight: '700' }}>—</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export function StatBox({ c, label, value, accent }) {
  return (
    <View
      style={{
        backgroundColor: c.card,
        borderColor: c.border,
        borderWidth: 1.5,
        borderRadius: 16,
        padding: 13,
        width: '48.5%',
        marginBottom: 10,
      }}
    >
      <Text style={{ color: c.sub, fontSize: 12.5, fontWeight: '700' }}>{label}</Text>
      <Text style={{ color: accent || c.ink, fontSize: 19, fontWeight: '900', marginTop: 4 }}>{value}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollPad: { padding: 16, paddingBottom: 110 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
