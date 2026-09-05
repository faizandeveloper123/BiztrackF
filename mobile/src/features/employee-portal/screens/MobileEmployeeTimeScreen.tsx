import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appError } from '../../../utils/appDialog';
import {
  getPortalTimeEntries,
  getCurrentTimeSession,
  startTimeSession,
  stopTimeSession,
} from '../../../services/employeePortal/employeePortalMobileApi';
import type { ProjectTimeEntry } from '../../../models/project/pmApiTypes';
import {
  WorkshopChrome,
  WorkshopLoading,
  WorkshopCard,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopPrimaryButton,
  WS,
} from '../../workshop/components/WorkshopChrome';

type Period = 'today' | 'week';

type SessionState = {
  id: string;
  startTime?: string | null;
  description?: string | null;
  isActive: boolean;
} | null;

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date) {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatElapsed(startIso?: string | null): string {
  if (!startIso) return '00:00:00';
  const start = new Date(startIso).getTime();
  if (Number.isNaN(start)) return '00:00:00';
  const sec = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatClockTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatHours(n?: number | null): string {
  return `${(n ?? 0).toFixed(1)}h`;
}

function sumHours(entries: ProjectTimeEntry[]): number {
  return entries.reduce((sum, e) => {
    if (e.clockOut && e.totalHours != null) return sum + (e.totalHours || 0);
    if (e.clockIn && !e.clockOut) {
      const start = new Date(e.clockIn).getTime();
      if (!Number.isNaN(start)) return sum + Math.max(0, (Date.now() - start) / 3600000);
    }
    return sum + (e.totalHours || 0);
  }, 0);
}

export function MobileEmployeeTimeScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [period, setPeriod] = useState<Period>('today');
  const [todayEntries, setTodayEntries] = useState<ProjectTimeEntry[]>([]);
  const [weekEntries, setWeekEntries] = useState<ProjectTimeEntry[]>([]);
  const [session, setSession] = useState<SessionState>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [noteSheet, setNoteSheet] = useState<'in' | 'out' | null>(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      const today = isoDate(now);
      const weekStart = isoDate(startOfWeek(now));
      const [todayRes, weekRes, sess] = await Promise.all([
        getPortalTimeEntries({ start_date: today, end_date: today }),
        getPortalTimeEntries({ start_date: weekStart, end_date: today }),
        getCurrentTimeSession(),
      ]);
      setTodayEntries(todayRes.timeEntries ?? []);
      setWeekEntries(weekRes.timeEntries ?? []);
      setSession(sess.session);
    } catch (e) {
      appError('Time', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath('/employee-portal/time');
  }, [setSidebarActivePath]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!session?.isActive) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [session?.isActive]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const clockedIn = Boolean(session?.isActive);
  void tick;

  const completedToday = useMemo(
    () => todayEntries.filter((e) => Boolean(e.clockOut)),
    [todayEntries],
  );
  const completedWeek = useMemo(
    () => weekEntries.filter((e) => Boolean(e.clockOut)),
    [weekEntries],
  );
  const listEntries = period === 'today' ? completedToday : completedWeek;
  const todayHours = sumHours(todayEntries);
  const weekHours = sumHours(weekEntries);

  const openClockIn = () => {
    setNote('');
    setNoteSheet('in');
  };

  const openClockOut = () => {
    setNote('');
    setNoteSheet('out');
  };

  const confirmClock = async (withNote: boolean) => {
    const text = withNote ? note.trim() : '';
    setBusy(true);
    try {
      if (noteSheet === 'out' && session?.id) {
        await stopTimeSession(session.id, text || undefined);
      } else if (noteSheet === 'in') {
        await startTimeSession(text ? { description: text } : undefined);
      }
      setNoteSheet(null);
      setNote('');
      await load();
    } catch (e) {
      appAlert('Time', extractErrorMessage(e, 'Action failed'));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !session && todayEntries.length === 0) return <WorkshopLoading />;

  return (
    <View style={{ flex: 1, backgroundColor: WS.bg }}>
      <WorkshopChrome title="Time clock" subtitle="Clock in and track your hours" scroll={false}>
        <WorkshopCard>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 12,
              fontWeight: '700',
              color: clockedIn ? '#15803d' : WS.textMuted,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}
          >
            {clockedIn ? 'Clocked in' : 'Not clocked in'}
          </Text>
          <Text
            style={{
              marginTop: 8,
              textAlign: 'center',
              fontFamily: 'monospace',
              fontSize: 36,
              fontWeight: '800',
              color: WS.text,
            }}
          >
            {clockedIn ? formatElapsed(session?.startTime) : '00:00:00'}
          </Text>
          <Text style={{ marginTop: 6, textAlign: 'center', fontSize: 13, color: WS.textMuted }}>
            {clockedIn
              ? `Since ${formatClockTime(session?.startTime)}`
              : 'Tap Clock in to start your day'}
          </Text>
          {clockedIn && session?.description ? (
            <Text
              style={{
                marginTop: 10,
                textAlign: 'center',
                fontSize: 13,
                color: WS.text,
                fontWeight: '600',
              }}
              numberOfLines={2}
            >
              {session.description}
            </Text>
          ) : null}

          <View style={{ marginTop: 16, flexDirection: 'row', gap: 10 }}>
            {clockedIn ? (
              <Pressable
                onPress={openClockOut}
                disabled={busy}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  borderRadius: 14,
                  paddingVertical: 15,
                  backgroundColor: busy ? '#fca5a5' : '#dc2626',
                }}
              >
                <Text style={{ fontWeight: '700', fontSize: 16, color: '#fff' }}>
                  {busy ? 'Clocking out…' : 'Clock out'}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={openClockIn}
                disabled={busy}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  borderRadius: 14,
                  paddingVertical: 15,
                  backgroundColor: busy ? '#86efac' : '#16a34a',
                }}
              >
                <Text style={{ fontWeight: '700', fontSize: 16, color: '#fff' }}>
                  {busy ? 'Clocking in…' : 'Clock in'}
                </Text>
              </Pressable>
            )}
          </View>
        </WorkshopCard>

        <View
          style={{
            marginTop: 12,
            marginBottom: 12,
            flexDirection: 'row',
            gap: 10,
          }}
        >
          <View
            style={{
              flex: 1,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: WS.border,
              backgroundColor: WS.card,
              padding: 14,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: WS.textMuted }}>Today</Text>
            <Text style={{ marginTop: 4, fontSize: 20, fontWeight: '800', color: WS.text }}>
              {formatHours(todayHours)}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: WS.border,
              backgroundColor: WS.card,
              padding: 14,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: WS.textMuted }}>This week</Text>
            <Text style={{ marginTop: 4, fontSize: 20, fontWeight: '800', color: WS.text }}>
              {formatHours(weekHours)}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {([
            { id: 'today' as const, label: 'Today' },
            { id: 'week' as const, label: 'This week' },
          ]).map((chip) => {
            const active = period === chip.id;
            return (
              <Pressable
                key={chip.id}
                onPress={() => setPeriod(chip.id)}
                style={{
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  backgroundColor: active ? WS.primary : '#f1f5f9',
                  borderWidth: 1,
                  borderColor: active ? WS.primary : WS.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: active ? '#fff' : '#475569',
                  }}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <FlatList
          style={{ flex: 1 }}
          data={listEntries}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={WS.primary} />
          }
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="time-outline"
              title={period === 'today' ? 'No completed punches today' : 'No completed punches this week'}
              subtitle="Clock in to start tracking your time."
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="time-outline"
              title={`${formatClockTime(item.clockIn)} – ${formatClockTime(item.clockOut)}`}
              subtitle={item.notes?.trim() || item.date}
              meta={formatHours(item.totalHours)}
              badges={[{ label: 'Done', tone: 'status' }]}
            />
          )}
        />
      </WorkshopChrome>

      <WorkshopFormSheet
        visible={noteSheet != null}
        title={noteSheet === 'out' ? 'Clock out' : 'Clock in'}
        onClose={() => {
          if (busy) return;
          setNoteSheet(null);
        }}
        footer={
          <>
            <WorkshopPrimaryButton
              label={
                busy
                  ? noteSheet === 'out'
                    ? 'Clocking out…'
                    : 'Clocking in…'
                  : noteSheet === 'out'
                    ? 'Clock out'
                    : 'Clock in'
              }
              onPress={() => void confirmClock(true)}
              disabled={busy}
            />
            <Pressable
              onPress={() => void confirmClock(false)}
              disabled={busy}
              style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}
            >
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>
                {noteSheet === 'out' ? 'Skip note & clock out' : 'Skip note & clock in'}
              </Text>
            </Pressable>
          </>
        }
      >
        <WorkshopFieldLabel>
          {noteSheet === 'out' ? 'Notes (optional)' : 'What are you working on? (optional)'}
        </WorkshopFieldLabel>
        <WorkshopTextInput
          value={note}
          onChangeText={setNote}
          placeholder={noteSheet === 'out' ? 'Add a note before clocking out' : 'e.g. Client calls, sprint tasks'}
          multiline
        />
      </WorkshopFormSheet>
    </View>
  );
}
