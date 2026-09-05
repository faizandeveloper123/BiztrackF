import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppModal } from '../layout/AppModal';
import { KeyboardBottomSheetShell } from '../layout/KeyboardBottomSheetShell';
import { WS } from '../../features/workshop/components/workshopTheme';
import {
  addMonths,
  buildMonthGrid,
  formatDisplayDate,
  formatDisplayDateTime,
  formatDateTimeValue,
  isSameDay,
  parseDateTimeValue,
  parseISODate,
  toISODateString,
  todayISODate,
} from '../../utils/dateUtils';
import { WorkshopFieldLabel } from '../../features/workshop/components/WorkshopUI';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

type DatePickerSheetProps = {
  visible: boolean;
  title: string;
  value: string;
  mode?: 'date' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  onClose: () => void;
  onConfirm: (value: string) => void;
};

function DatePickerSheet({
  visible,
  title,
  value,
  mode = 'date',
  minimumDate,
  maximumDate,
  onClose,
  onConfirm,
}: DatePickerSheetProps) {
  const initial = useMemo(() => {
    if (mode === 'datetime') {
      const p = parseDateTimeValue(value);
      if (p) {
        return {
          date: parseISODate(p.date) ?? new Date(),
          hour: p.hour,
          minute: p.minute,
        };
      }
    } else {
      const d = parseISODate(value);
      if (d) return { date: d, hour: 9, minute: 0 };
    }
    const now = new Date();
    return { date: now, hour: now.getHours(), minute: 0 };
  }, [mode, value, visible]);

  const [viewMonth, setViewMonth] = useState(startOfMonthSafe(initial.date));
  const [draft, setDraft] = useState<Date>(initial.date);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  useEffect(() => {
    if (!visible) return;
    setViewMonth(startOfMonthSafe(initial.date));
    setDraft(initial.date);
    setHour(initial.hour);
    setMinute(initial.minute);
  }, [visible, initial]);

  const cells = buildMonthGrid(viewMonth);
  const today = new Date();

  const inRange = (d: Date) => {
    if (minimumDate && d < stripTime(minimumDate)) return false;
    if (maximumDate && d > stripTime(maximumDate)) return false;
    return true;
  };

  const confirm = () => {
    const iso = toISODateString(draft);
    if (mode === 'datetime') {
      onConfirm(formatDateTimeValue(iso, hour, minute));
    } else {
      onConfirm(iso);
    }
    onClose();
  };

  return (
    <AppModal visible={visible} transparent animationType="slide" onClose={onClose}>
      <KeyboardBottomSheetShell
        overlayColor="rgba(15,23,42,0.55)"
        onOverlayPress={onClose}
      >
        <Pressable
          style={{
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: WS.card,
            paddingBottom: 24,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={{
              alignItems: 'center',
              paddingTop: 10,
              paddingBottom: 4,
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: WS.border,
              }}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: WS.border,
            }}
          >
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: WS.textMuted }}>
                Cancel
              </Text>
            </Pressable>
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 17,
                fontWeight: '800',
                color: WS.text,
              }}
            >
              {title}
            </Text>
            <Pressable onPress={confirm} hitSlop={8}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: WS.primary }}>
                Done
              </Text>
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Today', date: today },
                {
                  label: 'Tomorrow',
                  date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
                },
                {
                  label: 'Next week',
                  date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
                },
              ].map((chip) => {
                const enabled = inRange(chip.date);
                const active = isSameDay(chip.date, draft);
                return (
                  <Pressable
                    key={chip.label}
                    disabled={!enabled}
                    onPress={() => {
                      setDraft(chip.date);
                      setViewMonth(startOfMonthSafe(chip.date));
                    }}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      borderRadius: 12,
                      paddingVertical: 10,
                      backgroundColor: active ? WS.primary : WS.bg,
                      borderWidth: 1,
                      borderColor: active ? WS.primary : WS.border,
                      opacity: enabled ? 1 : 0.4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: active ? '#fff' : WS.textMuted,
                      }}
                    >
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Pressable
                onPress={() => setViewMonth((m) => addMonths(m, -1))}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: WS.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="chevron-back" size={20} color={WS.text} />
              </Pressable>
              <Text style={{ fontSize: 17, fontWeight: '800', color: WS.text }}>
                {viewMonth.toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <Pressable
                onPress={() => setViewMonth((m) => addMonths(m, 1))}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: WS.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="chevron-forward" size={20} color={WS.text} />
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {WEEKDAYS.map((d, i) => (
                <View key={`${d}-${i}`} style={{ flex: 1, alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: WS.textLight,
                    }}
                  >
                    {d}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {cells.map((day, idx) => {
                if (!day) {
                  return <View key={`empty-${idx}`} style={{ width: '14.28%', height: 44 }} />;
                }
                const selected = isSameDay(day, draft);
                const isToday = isSameDay(day, today);
                const disabled = !inRange(day);
                return (
                  <Pressable
                    key={toISODateString(day)}
                    disabled={disabled}
                    onPress={() => setDraft(day)}
                    style={{
                      width: '14.28%',
                      height: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: disabled ? 0.35 : 1,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected ? WS.primary : 'transparent',
                        borderWidth: isToday && !selected ? 2 : 0,
                        borderColor: WS.primary,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: selected ? '800' : '600',
                          color: selected ? '#fff' : WS.text,
                        }}
                      >
                        {day.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {mode === 'datetime' ? (
              <View style={{ marginTop: 20 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: WS.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 10,
                  }}
                >
                  Time
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {HOURS.map((h) => {
                      const active = hour === h;
                      return (
                        <Pressable
                          key={h}
                          onPress={() => setHour(h)}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            borderRadius: 12,
                            backgroundColor: active ? WS.primary : WS.bg,
                            borderWidth: 1,
                            borderColor: active ? WS.primary : WS.border,
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: '700',
                              color: active ? '#fff' : WS.text,
                            }}
                          >
                            {String(h).padStart(2, '0')}:00
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 10 }}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {MINUTES.map((m) => {
                    const active = minute === m;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setMinute(m)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 12,
                          backgroundColor: active ? WS.primaryLight : WS.bg,
                          borderWidth: 1,
                          borderColor: active ? WS.primaryMuted : WS.border,
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: '700',
                            color: active ? WS.primaryDark : WS.textMuted,
                          }}
                        >
                          :{String(m).padStart(2, '0')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            <Pressable
              onPress={confirm}
              style={{
                marginTop: 20,
                borderRadius: 14,
                backgroundColor: WS.primary,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontWeight: '800', fontSize: 16, color: '#fff' }}>
                {mode === 'datetime'
                  ? formatDisplayDateTime(formatDateTimeValue(toISODateString(draft), hour, minute))
                  : formatDisplayDate(toISODateString(draft))}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </KeyboardBottomSheetShell>
    </AppModal>
  );
}

function startOfMonthSafe(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function WorkshopDatePickerField(props: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const display = formatDisplayDate(props.value) || props.placeholder || 'Select date';

  return (
    <>
      {props.label ? <WorkshopFieldLabel>{props.label}</WorkshopFieldLabel> : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          borderWidth: 1,
          borderColor: WS.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 13,
          backgroundColor: '#fafafa',
          marginBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: WS.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="calendar-outline" size={18} color={WS.primary} />
        </View>
        <Text
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: props.value ? '600' : '500',
            color: props.value ? WS.text : WS.textLight,
          }}
          numberOfLines={1}
        >
          {display}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={WS.textMuted} />
      </Pressable>
      <DatePickerSheet
        visible={open}
        title={props.label ?? 'Select date'}
        value={props.value || todayISODate()}
        minimumDate={props.minimumDate}
        maximumDate={props.maximumDate}
        onClose={() => setOpen(false)}
        onConfirm={props.onChange}
      />
    </>
  );
}

export function WorkshopDateTimePickerField(props: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const display =
    formatDisplayDateTime(props.value) || props.placeholder || 'Select date & time';

  return (
    <>
      {props.label ? <WorkshopFieldLabel>{props.label}</WorkshopFieldLabel> : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          borderWidth: 1,
          borderColor: WS.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 13,
          backgroundColor: '#fafafa',
          marginBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: WS.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="time-outline" size={18} color={WS.primary} />
        </View>
        <Text
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: props.value ? '600' : '500',
            color: props.value ? WS.text : WS.textLight,
          }}
          numberOfLines={2}
        >
          {display}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={WS.textMuted} />
      </Pressable>
      <DatePickerSheet
        visible={open}
        title={props.label ?? 'Select date & time'}
        value={props.value}
        mode="datetime"
        onClose={() => setOpen(false)}
        onConfirm={props.onChange}
      />
    </>
  );
}

export function ProductDatePickerField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const display = formatDisplayDate(props.value) || 'Select date';

  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          marginBottom: 4,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: '#64748b',
        }}
      >
        {props.label}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          borderWidth: 1,
          borderColor: '#e2e8f0',
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 12,
          backgroundColor: '#f8fafc',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Ionicons name="calendar-outline" size={18} color="#4f46e5" />
        <Text style={{ flex: 1, fontSize: 15, color: props.value ? '#0f172a' : '#94a3b8' }}>
          {display}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
      </Pressable>
      <DatePickerSheet
        visible={open}
        title={props.label}
        value={props.value || todayISODate()}
        onClose={() => setOpen(false)}
        onConfirm={props.onChange}
      />
    </View>
  );
}
