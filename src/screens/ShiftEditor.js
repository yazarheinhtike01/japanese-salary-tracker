'use strict';

import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, TextInput, Alert } from 'react-native';
import { BigButton, Chip, TimeField } from '../components';

const E = require('../engine');

const PRESETS = {
  day: { start: '07:00', end: '16:00' },
  evening: { start: '18:00', end: '22:45' },
  custom: { start: '09:00', end: '17:00' },
};

export default function ShiftEditor({ visible, date, shift, settings, c, t, onSave, onDelete, onClose }) {
  const [type, setType] = useState('day');
  const [schedStart, setSchedStart] = useState('07:00');
  const [schedEnd, setSchedEnd] = useState('16:00');
  const [actStart, setActStart] = useState('');
  const [actEnd, setActEnd] = useState('');
  const [rate, setRate] = useState(String(settings.dayRate));

  useEffect(() => {
    if (!visible) return;
    if (shift) {
      setType(shift.type);
      setSchedStart(shift.scheduledStart);
      setSchedEnd(shift.scheduledEnd);
      setActStart(shift.actualStart || '');
      setActEnd(shift.actualEnd || '');
      setRate(String(shift.rate));
    } else {
      setType('day');
      setSchedStart(PRESETS.day.start);
      setSchedEnd(PRESETS.day.end);
      setActStart('');
      setActEnd('');
      setRate(String(settings.dayRate));
    }
  }, [visible, shift, date]);

  const pickType = (tp) => {
    setType(tp);
    if (!shift) {
      setSchedStart(PRESETS[tp].start);
      setSchedEnd(PRESETS[tp].end);
      setRate(String(tp === 'evening' ? settings.eveningRate : settings.dayRate));
    }
  };

  const draft = {
    date,
    type,
    scheduledStart: schedStart,
    scheduledEnd: schedEnd,
    actualStart: actStart || null,
    actualEnd: actEnd || null,
    rate: Number(rate) || 0,
  };

  let preview = null;
  try {
    preview = E.computeShift(draft, settings.breaks);
  } catch (e) {
    preview = null;
  }
  const timesValid =
    E.isValidTime(schedStart) &&
    E.isValidTime(schedEnd) &&
    (actStart === '' || E.isValidTime(actStart)) &&
    (actEnd === '' || E.isValidTime(actEnd));

  const save = () => {
    if (!timesValid) {
      Alert.alert(t('invalidTime'));
      return;
    }
    onSave(Object.assign({}, draft, { id: shift ? shift.id : undefined }));
  };

  const typeColor = (tp) => (tp === 'day' ? c.gold : tp === 'evening' ? c.primary : c.green);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
          <Text style={{ color: c.ink, fontSize: 21, fontWeight: '900' }}>
            {shift ? t('editShift') : t('addShift')}
          </Text>
          <Text style={{ color: c.sub, fontSize: 15, fontWeight: '700', marginTop: 2, marginBottom: 14 }}>{date}</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <Chip c={c} label={'☀ ' + t('dayShift')} selected={type === 'day'} color={typeColor('day')} onPress={() => pickType('day')} />
            <Chip c={c} label={'☾ ' + t('eveningShift')} selected={type === 'evening'} color={typeColor('evening')} onPress={() => pickType('evening')} />
            <Chip c={c} label={'✦ ' + t('customShift')} selected={type === 'custom'} color={typeColor('custom')} onPress={() => pickType('custom')} />
          </View>

          <Text style={{ color: c.ink, fontSize: 15, fontWeight: '800', marginTop: 10, marginBottom: 8 }}>{t('scheduled')}</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TimeField c={c} label={t('start')} value={schedStart} onChange={setSchedStart} />
            <TimeField c={c} label={t('end')} value={schedEnd} onChange={setSchedEnd} />
          </View>

          <Text style={{ color: c.ink, fontSize: 15, fontWeight: '800', marginTop: 6, marginBottom: 8 }}>
            {t('actual')} — {t('clockIn')} / {t('clockOut')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TimeField c={c} label={t('clockIn')} value={actStart} onChange={setActStart} allowEmpty />
            <TimeField c={c} label={t('clockOut')} value={actEnd} onChange={setActEnd} allowEmpty />
          </View>

          <Text style={{ color: c.sub, fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
            {t('rate')} (¥{t('perHour')})
          </Text>
          <TextInput
            value={rate}
            onChangeText={(txt) => setRate(txt.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            style={{
              backgroundColor: c.inputBg, borderColor: c.border, borderWidth: 2, borderRadius: 12,
              color: c.ink, fontSize: 20, fontWeight: '800', paddingVertical: 9, paddingHorizontal: 12,
              textAlign: 'center', marginBottom: 16,
            }}
          />

          {preview ? (
            <View style={{ backgroundColor: c.stampBg, borderRadius: 16, padding: 14, marginBottom: 18 }}>
              <Text style={{ color: c.ink, fontSize: 15, fontWeight: '700' }}>
                {t('payableTime')}: {E.formatDuration(preview.payableMinutes)} ・ {t('breakDeducted')}: {E.formatDuration(preview.breakMinutes)}
              </Text>
              <Text style={{ color: c.ink, fontSize: 15, fontWeight: '700', marginTop: 4 }}>
                {t('late')}: {preview.lateMinutes} {t('minutes')} ・ {t('early')}: {preview.earlyMinutes} {t('minutes')}
              </Text>
              <Text style={{ color: c.red, fontSize: 24, fontWeight: '900', marginTop: 6 }}>
                {t('earnings')}: {E.formatYen(preview.earnings)}
              </Text>
            </View>
          ) : null}

          <BigButton c={c} title={t('save')} onPress={save} />
          <View style={{ height: 10 }} />
          <BigButton c={c} title={t('cancel')} kind="ghost" onPress={onClose} />
          {shift ? (
            <>
              <View style={{ height: 10 }} />
              <BigButton
                c={c}
                title={t('delete')}
                kind="danger"
                onPress={() =>
                  Alert.alert(t('confirmDelete'), '', [
                    { text: t('cancel'), style: 'cancel' },
                    { text: t('delete'), style: 'destructive', onPress: () => onDelete(shift.id) },
                  ])
                }
              />
            </>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
