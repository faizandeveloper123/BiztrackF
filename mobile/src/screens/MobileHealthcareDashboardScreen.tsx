import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import {
  formatYMD,
  startOfMonth,
  addDays,
} from '../utils/dateMobile';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../contexts/SidebarDrawerContext';
import type { Appointment } from '../models/healthcare';
import {
  getDoctors,
  getPatients,
  getStaff,
  getAppointments,
  getAdmissions,
  loadMonthExpenseTotal,
} from '../services/healthcare/healthcareMobileApi';
import { HealthcareCard } from '../features/healthcare/components/HealthcareChrome';

function sortByDateTime(a: Appointment, b: Appointment) {
  const da = `${a.appointment_date}T${a.start_time || '00:00'}`;
  const db = `${b.appointment_date}T${b.start_time || '00:00'}`;
  return da.localeCompare(db);
}

type Snapshot = {
  doctorTotal: number;
  patientTotal: number;
  staffTotal: number;
  todayAppointmentTotal: number;
  todayScheduled: number;
  admittedCount: number;
  monthExpenseTotal: number;
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
};

const quickLinks: { path: string; label: string }[] = [
  { path: '/healthcare/appointments', label: 'Appointments' },
  { path: '/healthcare/calendar', label: 'Calendar' },
  { path: '/healthcare/patients', label: 'Patients' },
  { path: '/healthcare/doctors', label: 'Doctors' },
  { path: '/healthcare/staff', label: 'Staff' },
  { path: '/healthcare/admitted-patients', label: 'Admissions' },
  { path: '/healthcare/payments', label: 'Payments' },
  { path: '/healthcare/daily-expense', label: 'Daily expenses' },
];

export function MobileHealthcareDashboardScreen() {
  const { setSidebarActivePath, navigateMenuPath } = useSidebarDrawer();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSidebarActivePath('/dashboard');
  }, [setSidebarActivePath]);

  const load = useCallback(async () => {
    const today = formatYMD(new Date());
    const monthStart = formatYMD(startOfMonth(new Date()));
    const weekEnd = formatYMD(addDays(new Date(), 7));

    const [
      doctorsRes,
      patientsRes,
      staffRes,
      todayAptsRes,
      weekAptsRes,
      admissionsRes,
      monthExpenseTotal,
    ] = await Promise.all([
      getDoctors({ limit: 1, is_active: true }),
      getPatients({ limit: 1, is_active: true }),
      getStaff({ limit: 1, is_active: true }),
      getAppointments({
        date_from: today,
        date_to: today,
        limit: 200,
      }),
      getAppointments({
        date_from: today,
        date_to: weekEnd,
        limit: 200,
      }),
      getAdmissions({ status: 'admitted', limit: 200 }),
      loadMonthExpenseTotal(monthStart, today),
    ]);

    const todayList = [...todayAptsRes.appointments].sort(sortByDateTime);
    const todayScheduled = todayList.filter((x) => x.status === 'scheduled')
      .length;
    const upcoming = weekAptsRes.appointments
      .filter((a) => a.status === 'scheduled' && a.appointment_date > today)
      .sort(sortByDateTime)
      .slice(0, 8);

    setSnapshot({
      doctorTotal: doctorsRes.total,
      patientTotal: patientsRes.total,
      staffTotal: staffRes.total,
      todayAppointmentTotal: todayAptsRes.total,
      todayScheduled,
      admittedCount: admissionsRes.total,
      monthExpenseTotal,
      todayAppointments: todayList.slice(0, 12),
      upcomingAppointments: upcoming,
    });
  }, []);

  const runLoad = useCallback(async (isRefresh: boolean) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setSnapshot(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    void runLoad(false);
  }, [runLoad]);

  if (loading && !snapshot) {
    return (
      <View className="flex-1 bg-slate-50">
        <View className="flex-row border-b border-slate-200 bg-white px-3 py-2">
          <MenuHeaderButton />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0d9488" />
          <Text className="mt-3 text-slate-600">Loading…</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <View className="flex-1 px-2">
          <Text className="text-center text-base font-semibold text-slate-900">
            Healthcare Dashboard
          </Text>
          <Text className="text-center text-xs text-slate-500">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
        <Pressable
          onPress={() => void runLoad(true)}
          className="p-2"
          disabled={refreshing}
        >
          <Ionicons name="refresh" size={22} color="#0f766e" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void runLoad(true)}
            tintColor="#0d9488"
          />
        }
      >
        {error ? (
          <HealthcareCard>
            <Text className="text-center text-slate-600">{error}</Text>
            <Pressable
              className="mt-3 items-center rounded-lg bg-teal-600 py-2"
              onPress={() => void runLoad(false)}
            >
              <Text className="font-semibold text-white">Try again</Text>
            </Pressable>
          </HealthcareCard>
        ) : null}

        {snapshot ? (
          <>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {[
                {
                  label: 'Patients',
                  value: snapshot.patientTotal,
                  icon: 'people' as const,
                  sub: 'Active',
                },
                {
                  label: 'Doctors',
                  value: snapshot.doctorTotal,
                  icon: 'medkit' as const,
                  sub: 'Active',
                },
                {
                  label: 'Staff',
                  value: snapshot.staffTotal,
                  icon: 'person' as const,
                  sub: 'Active',
                },
                {
                  label: 'Today',
                  value: snapshot.todayAppointmentTotal,
                  icon: 'calendar' as const,
                  sub: `${snapshot.todayScheduled} scheduled`,
                },
                {
                  label: 'Admitted',
                  value: snapshot.admittedCount,
                  icon: 'business' as const,
                  sub: 'Current',
                },
                {
                  label: 'Expenses',
                  value: snapshot.monthExpenseTotal.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  }),
                  icon: 'wallet' as const,
                  sub: 'Month to date',
                },
              ].map((tile) => (
                <View
                  key={tile.label}
                  className="min-w-[30%] flex-1 rounded-xl border border-slate-200 bg-white p-3"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-medium text-slate-500">
                      {tile.label}
                    </Text>
                    <Ionicons name={tile.icon} size={16} color="#64748b" />
                  </View>
                  <Text className="mt-1 text-xl font-bold text-slate-900">
                    {tile.value}
                  </Text>
                  <Text className="text-xs text-slate-400">{tile.sub}</Text>
                </View>
              ))}
            </View>

            <HealthcareCard>
              <Text className="text-base font-semibold text-slate-900">
                Today&apos;s schedule
              </Text>
              {snapshot.todayAppointments.length === 0 ? (
                <Text className="mt-2 text-sm text-slate-500">
                  No appointments today.
                </Text>
              ) : (
                snapshot.todayAppointments.map((a) => (
                  <View
                    key={a.id}
                    className="mt-3 border-t border-slate-100 pt-3 first:mt-0 first:border-t-0 first:pt-0"
                  >
                    <Text className="font-medium text-slate-800">
                      {a.start_time}
                      {a.end_time ? ` – ${a.end_time}` : ''}
                    </Text>
                    <Text className="text-sm text-slate-600">
                      {a.patient_name || '—'}
                    </Text>
                    <Text className="text-xs capitalize text-slate-500">
                      {a.status?.replace('_', ' ') || ''}
                    </Text>
                  </View>
                ))
              )}
            </HealthcareCard>

            <HealthcareCard>
              <Text className="text-base font-semibold text-slate-900">
                Upcoming (7 days)
              </Text>
              {snapshot.upcomingAppointments.length === 0 ? (
                <Text className="mt-2 text-sm text-slate-500">
                  No upcoming visits.
                </Text>
              ) : (
                snapshot.upcomingAppointments.map((a) => (
                  <View
                    key={a.id}
                    className="mt-3 border-t border-slate-100 pt-3 first:mt-0 first:border-t-0 first:pt-0"
                  >
                    <Text className="text-sm font-medium text-slate-800">
                      {new Date(
                        `${a.appointment_date}T12:00:00`,
                      ).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      · {a.start_time}
                    </Text>
                    <Text className="text-sm text-slate-600">
                      {a.patient_name || '—'}
                    </Text>
                  </View>
                ))
              )}
            </HealthcareCard>

            <HealthcareCard>
              <Text className="mb-3 text-base font-semibold text-slate-900">
                Quick links
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {quickLinks.map((q) => (
                  <Pressable
                    key={q.path}
                    onPress={() => void navigateMenuPath(q.path)}
                    className="rounded-lg bg-teal-50 px-3 py-2 active:bg-teal-100"
                  >
                    <Text className="text-sm font-medium text-teal-800">
                      {q.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </HealthcareCard>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
