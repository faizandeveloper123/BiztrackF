import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../layout/MenuHeaderButton';
import {
  getEmployeePortalDashboard,
  startTimeSession,
  stopTimeSession,
} from '../../services/employeePortal/employeePortalMobileApi';
import type { EmployeePortalDashboard } from '../../models/employeePortal';
import { extractErrorMessage } from '../../utils/errorUtils';
import { appAlert } from '../../utils/appDialog';

interface MobileEmployeeDashboardProps {
  onLogout: () => void;
  onNavigatePath?: (path: string) => void | Promise<void>;
}

function formatElapsed(startIso?: string | null): string {
  if (!startIso) return '00:00:00';
  const start = new Date(startIso).getTime();
  const sec = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function MobileEmployeeDashboard({
  onLogout,
  onNavigatePath,
}: MobileEmployeeDashboardProps) {
  const [data, setData] = useState<EmployeePortalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clockBusy, setClockBusy] = useState(false);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const d = await getEmployeePortalDashboard();
      setData(d);
    } catch (e) {
      appAlert('Employee', extractErrorMessage(e, 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!data?.activeSession?.isActive) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [data?.activeSession?.isActive]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const toggleClock = async () => {
    if (!data) return;
    setClockBusy(true);
    try {
      if (data.activeSession?.isActive && data.activeSession.id) {
        await stopTimeSession(data.activeSession.id);
      } else {
        await startTimeSession();
      }
      await load();
    } catch (e) {
      appAlert('Time', extractErrorMessage(e, 'Clock action failed'));
    } finally {
      setClockBusy(false);
    }
  };

  if (loading && !data) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const stats = data?.stats;
  const firstName = data?.employee?.firstName || 'there';
  const clockedIn = Boolean(data?.activeSession?.isActive);
  void tick;

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="pb-10 pt-2"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
      }
    >
      <View className="border-b border-slate-200 bg-white px-4 pb-4 pt-2">
        <View className="flex-row items-start justify-between">
          <View className="min-w-0 flex-1 flex-row items-start gap-2 pr-2">
            <MenuHeaderButton />
            <View className="min-w-0 flex-1">
              <Text className="text-2xl font-bold text-indigo-700">
                Hi, {firstName}
              </Text>
              <Text className="mt-1 text-sm text-slate-600">
                Your work for today
              </Text>
            </View>
          </View>
          <Pressable
            className="rounded-lg border border-slate-200 px-3 py-2 active:bg-slate-100"
            onPress={() => void onLogout()}
          >
            <Text className="text-sm font-medium text-slate-700">Sign out</Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-4 px-4">
        <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="timer-outline" size={20} color="#4f46e5" />
              <Text className="text-base font-semibold text-slate-900">Time clock</Text>
            </View>
            <Text className="text-sm font-semibold text-violet-600">
              {stats?.hoursToday ?? 0}h today
            </Text>
          </View>
          <Text className="mt-3 text-center font-mono text-3xl font-bold text-slate-900">
            {clockedIn ? formatElapsed(data?.activeSession?.startTime) : '00:00:00'}
          </Text>
          <Text className="mt-1 text-center text-sm text-slate-500">
            {clockedIn ? 'You are clocked in' : 'Clock in when you start work'}
          </Text>
          {clockedIn && data?.activeSession?.description ? (
            <Text className="mt-2 text-center text-sm font-medium text-slate-700" numberOfLines={2}>
              {data.activeSession.description}
            </Text>
          ) : null}
          <Pressable
            className={`mt-4 items-center rounded-lg py-3 ${clockedIn ? 'bg-red-600 active:bg-red-700' : 'bg-emerald-600 active:bg-emerald-700'}`}
            disabled={clockBusy}
            onPress={() => void toggleClock()}
          >
            <Text className="font-semibold text-white">
              {clockBusy
                ? clockedIn
                  ? 'Clocking out…'
                  : 'Clocking in…'
                : clockedIn
                  ? 'Clock out'
                  : 'Clock in'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-4 flex-row gap-3 px-4">
        <Pressable
          className="min-w-0 flex-1 rounded-xl border-l-4 border-l-indigo-500 bg-white p-4 shadow-sm active:opacity-90"
          onPress={() => void onNavigatePath?.('/employee-portal/tasks')}
        >
          <Text className="text-xs font-medium text-slate-600">Open tasks</Text>
          <Text className="mt-2 text-xl font-bold text-indigo-700">
            {stats?.openTasks ?? 0}
          </Text>
          <Text className="text-xs text-slate-500">
            {stats?.tasksDueToday ?? 0} due today
          </Text>
        </Pressable>
        <Pressable
          className="min-w-0 flex-1 rounded-xl border-l-4 border-l-emerald-500 bg-white p-4 shadow-sm active:opacity-90"
          onPress={() => void onNavigatePath?.('/employee-portal/leave')}
        >
          <Text className="text-xs font-medium text-slate-600">Leave balance</Text>
          <Text className="mt-2 text-xl font-bold text-emerald-600">
            {stats?.leaveBalance ?? 0}
          </Text>
          <Text className="text-xs text-slate-500">
            {(stats?.pendingLeave ?? 0) > 0
              ? `${stats?.pendingLeave} pending`
              : 'Days available'}
          </Text>
        </Pressable>
      </View>

      <View className="mt-4 px-4">
        <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="checkbox-outline" size={20} color="#4f46e5" />
              <Text className="text-base font-semibold text-slate-900">Today&apos;s tasks</Text>
            </View>
            <Pressable onPress={() => void onNavigatePath?.('/employee-portal/tasks')}>
              <Text className="text-sm font-semibold text-indigo-600">View all</Text>
            </Pressable>
          </View>
          {(data?.todayTasks ?? []).length === 0 ? (
            <Text className="mt-4 text-center text-sm text-slate-500">No tasks for today</Text>
          ) : (
            (data?.todayTasks ?? []).slice(0, 5).map((task) => (
              <Pressable
                key={task.id}
                className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 active:bg-slate-100"
                onPress={() => void onNavigatePath?.('/employee-portal/tasks')}
              >
                <Text className="font-medium text-slate-900">{task.title}</Text>
                <View className="mt-1 flex-row items-center justify-between">
                  <Text className="text-xs capitalize text-slate-500">{task.status}</Text>
                  {task.dueDate ? (
                    <Text className="text-xs text-indigo-600">
                      Due {task.dueDate.slice(0, 10)}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))
          )}
        </View>
      </View>

      <View className="mt-4 px-4">
        <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <Text className="text-base font-semibold text-slate-900">Quick actions</Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {[
              { path: '/employee-portal/time', label: 'My time', icon: 'time-outline' as const },
              { path: '/employee-portal/leave', label: 'Request leave', icon: 'calendar-outline' as const },
              { path: '/employee-portal/tasks', label: 'My tasks', icon: 'checkbox-outline' as const },
              { path: '/employee-portal/profile', label: 'My profile', icon: 'person-outline' as const },
              { path: '/employee-portal/devices', label: 'My devices', icon: 'laptop-outline' as const },
            ].map((action) => (
              <Pressable
                key={action.path}
                className="min-w-[45%] flex-1 items-center rounded-lg border border-slate-200 bg-slate-50 py-4 active:bg-slate-100"
                onPress={() => void onNavigatePath?.(action.path)}
              >
                <Ionicons name={action.icon} size={22} color="#4f46e5" />
                <Text className="mt-2 text-sm font-medium text-slate-700">{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
