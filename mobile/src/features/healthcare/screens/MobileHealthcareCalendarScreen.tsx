import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import {
  formatYMD,
  formatShortMonthDay,
  formatWeekdayMonthDay,
  startOfWeekMonday,
  endOfWeekFromMonday,
  addWeeks,
} from '../../../utils/dateMobile';
import { Ionicons } from '@expo/vector-icons';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import type { Appointment, Doctor } from '../../../models/healthcare';
import {
  getAppointmentsCalendar,
  getDoctors,
} from '../../../services/healthcare/healthcareMobileApi';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  HealthcareChrome,
  HealthcareCard,
} from '../components/HealthcareChrome';
import { PickerModal } from '../components/PickerModal';

function sortApts(a: Appointment, b: Appointment) {
  const da = `${a.appointment_date}T${a.start_time || '00:00'}`;
  const db = `${b.appointment_date}T${b.start_time || '00:00'}`;
  return da.localeCompare(db);
}

export function MobileHealthcareCalendarScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [doctorFilter, setDoctorFilter] = useState('__all__');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [list, setList] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [docPick, setDocPick] = useState(false);

  useEffect(() => {
    setSidebarActivePath('/healthcare/calendar');
  }, [setSidebarActivePath]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await getDoctors({ limit: 500 });
        setDoctors(res.doctors);
      } catch {
        // ignore
      }
    })();
  }, []);

  const load = useCallback(async () => {
    const from = formatYMD(weekStart);
    const to = formatYMD(endOfWeekFromMonday(weekStart));
    const res = await getAppointmentsCalendar({
      date_from: from,
      date_to: to,
      doctor_id:
        doctorFilter !== '__all__' ? doctorFilter : undefined,
    });
    setList([...res.appointments].sort(sortApts));
  }, [weekStart, doctorFilter]);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch (e) {
        Alert.alert('Calendar', extractErrorMessage(e, 'Failed to load'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [load],
  );

  useEffect(() => {
    void run(false);
  }, [run]);

  const byDate = list.reduce<Record<string, Appointment[]>>((acc, a) => {
    const k = a.appointment_date;
    if (!acc[k]) acc[k] = [];
    acc[k].push(a);
    return acc;
  }, {});

  const days = Object.keys(byDate).sort();

  const doctorItems = doctors.map((d) => ({
    id: d.id,
    label: `${d.first_name} ${d.last_name}`.trim(),
  }));

  return (
    <HealthcareChrome
      title="Calendar"
      subtitle={
        formatShortMonthDay(weekStart) +
        ' – ' +
        endOfWeekFromMonday(weekStart).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      }
      scroll={false}
    >
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => setWeekStart((w: Date) => addWeeks(w, -1))}
          className="rounded-lg bg-white p-2"
        >
          <Ionicons name="chevron-back" size={22} color="#0f766e" />
        </Pressable>
        <Pressable
          onPress={() => setDocPick(true)}
          className="flex-1 mx-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
        >
          <Text className="text-center text-sm text-slate-800">
            {doctorFilter === '__all__'
              ? 'All doctors'
              : doctorItems.find((x) => x.id === doctorFilter)?.label}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setWeekStart((w: Date) => addWeeks(w, 1))}
          className="rounded-lg bg-white p-2"
        >
          <Ionicons name="chevron-forward" size={22} color="#0f766e" />
        </Pressable>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator color="#0d9488" />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void run(true)}
              tintColor="#0d9488"
            />
          }
        >
          {days.length === 0 ? (
            <Text className="py-8 text-center text-slate-500">
              No appointments this week.
            </Text>
          ) : (
            days.map((d) => (
              <HealthcareCard key={d}>
                <Text className="mb-2 font-semibold text-slate-900">
                  {formatWeekdayMonthDay(d)}
                </Text>
                {byDate[d].map((a) => (
                  <View
                    key={a.id}
                    className="mb-2 border-b border-slate-50 pb-2 last:mb-0 last:border-b-0"
                  >
                    <Text className="text-sm font-medium text-slate-800">
                      {a.start_time}
                      {a.end_time ? ` – ${a.end_time}` : ''}
                    </Text>
                    <Text className="text-sm text-slate-600">
                      {a.patient_name}
                    </Text>
                    <Text className="text-xs capitalize text-slate-500">
                      {a.status?.replace('_', ' ')}
                    </Text>
                  </View>
                ))}
              </HealthcareCard>
            ))
          )}
        </ScrollView>
      )}

      <PickerModal
        visible={docPick}
        title="Doctor"
        items={[{ id: '__all__', label: 'All doctors' }, ...doctorItems]}
        onSelect={(x) => setDoctorFilter(x.id)}
        onClose={() => setDocPick(false)}
      />
    </HealthcareChrome>
  );
}
