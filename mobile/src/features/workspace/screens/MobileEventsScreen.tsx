import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, Linking, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MobileFormSheet } from '../../../components/layout/MobileForm';
import {
  WorkshopChrome,
  WorkshopChipSelect,
  WorkshopFilterBar,
  countActiveFilters,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopDatePickerField,
  WorkshopPickerField,
  WS,
} from '../../workshop/components/WorkshopChrome';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import { apiService } from '../../../services/ApiService';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import { usePermissions } from '../../../hooks/usePermissions';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  eventType: string;
  startDate: string;
  endDate: string;
  location?: string;
  isOnline: boolean;
  googleMeetLink?: string;
  participants: string[];
  status: string;
  projectId?: string;
}

const STATUS_OPTS = [
  { value: 'all', label: 'All statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

const TYPE_OPTS = [
  { value: 'all', label: 'All types' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'other', label: 'Other' },
] as const;

function label(s: string): string {
  return s.replace(/_/g, ' ');
}

export function MobileEventsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageEvents } = usePermissions();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [googleOk, setGoogleOk] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('meeting');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [participants, setParticipants] = useState('');
  const [typePickOpen, setTypePickOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);

  const checkGoogle = useCallback(async () => {
    try {
      const res = await apiService.getGoogleAuthStatus();
      setGoogleOk(Boolean((res as { authorized?: boolean }).authorized));
    } catch {
      setGoogleOk(false);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getEvents({ limit: 200 });
      const list = (res as { events?: CalendarEvent[] }).events ?? [];
      setEvents(list);
    } catch (e) {
      appError('Events', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/events',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadEvents();
    void checkGoogle();
  }, [loadEvents, checkGoogle]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void checkGoogle();
    });
    return () => sub.remove();
  }, [checkGoogle]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadEvents(), checkGoogle()]);
    setRefreshing(false);
  }, [loadEvents, checkGoogle]);

  const connectGoogle = useCallback(async () => {
    try {
      setAuthBusy(true);
      const res = await apiService.getGoogleAuthUrl();
      const url = (res as { authorization_url?: string }).authorization_url;
      if (!url) {
        appAlert('Events', 'No authorization URL returned.');
        return;
      }
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        appAlert('Events', 'Cannot open browser for Google Calendar.');
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      appError('Events', extractErrorMessage(e, 'Connect failed'));
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const filtered = useMemo(() => {
    return events.filter((ev) => {
      const q = search.toLowerCase();
      const matchSearch =
        ev.title.toLowerCase().includes(q) ||
        (ev.description?.toLowerCase().includes(q) ?? false);
      const matchStatus =
        statusFilter === 'all' || ev.status === statusFilter;
      const matchType = typeFilter === 'all' || ev.eventType === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [events, search, statusFilter, typeFilter]);

  const submitCreate = useCallback(async () => {
    if (!title.trim() || !startDate || !endDate) {
      appAlert('Events', 'Title, start date, and end date are required.');
      return;
    }
    try {
      setCreateBusy(true);
      const start = new Date(`${startDate}T${startTime || '09:00'}`);
      const end = new Date(`${endDate}T${endTime || '10:00'}`);
      await apiService.createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        eventType,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        location: location.trim() || undefined,
        isOnline,
        participants: participants
          ? participants.split(',').map((p) => p.trim()).filter(Boolean)
          : [],
        discussionPoints: [],
        reminderMinutes: 15,
        recurrenceType: undefined,
      });
      setCreateOpen(false);
      setTitle('');
      setDescription('');
      await loadEvents();
    } catch (e) {
      appError('Events', extractErrorMessage(e, 'Create failed'));
    } finally {
      setCreateBusy(false);
    }
  }, [
    title,
    description,
    eventType,
    startDate,
    startTime,
    endDate,
    endTime,
    location,
    isOnline,
    participants,
    loadEvents,
  ]);

  const onJoin = useCallback(
    async (ev: CalendarEvent) => {
      try {
        if (ev.googleMeetLink) {
          await Linking.openURL(ev.googleMeetLink);
          return;
        }
        const res = await apiService.joinEvent(ev.id);
        const link = (res as { meet_link?: string }).meet_link;
        if (link) await Linking.openURL(link);
        await loadEvents();
      } catch (e) {
        appError('Events', extractErrorMessage(e, 'Join failed'));
      }
    },
    [loadEvents],
  );

  const onLeave = useCallback(
    async (id: string) => {
      try {
        await apiService.leaveEvent(id);
        await loadEvents();
      } catch (e) {
        appError('Events', extractErrorMessage(e, 'Leave failed'));
      }
    },
    [loadEvents],
  );

  const onDelete = useCallback(
    (ev: CalendarEvent) => {
      appConfirm({
        title: 'Delete event',
        message: `Remove "${ev.title}"?`,
        confirmLabel: 'Delete',
        destructive: true,
        onConfirm: async () => {
          try {
            await apiService.deleteEvent(ev.id);
            await loadEvents();
          } catch (e) {
            appError('Events', extractErrorMessage(e, 'Delete failed'));
          }
        },
      });
    },
    [loadEvents],
  );

  const typeFormOptions = TYPE_OPTS.filter((o) => o.value !== 'all');

  const openCreate = () => {
    setTitle('');
    setDescription('');
    setEventType('meeting');
    setStartDate('');
    setEndDate('');
    setStartTime('09:00');
    setEndTime('10:00');
    setLocation('');
    setIsOnline(true);
    setParticipants('');
    setCreateOpen(true);
  };

  return (
    <>
      <WorkshopChrome
        title="Events"
        subtitle="Calendar & meetings"
        right={
          canManageEvents() ? (
            <WorkshopHeaderButton onPress={openCreate} />
          ) : (
            <View style={{ width: 72 }} />
          )
        }
        scroll={false}
      >
        {!googleOk ? (
          <View
            style={{
              marginBottom: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#fcd34d',
              backgroundColor: WS.warningBg,
              padding: 14,
            }}
          >
            <Text style={{ fontSize: 13, color: '#92400e' }}>
              Connect Google Calendar for Meet links and sync.
            </Text>
            <Pressable
              onPress={() => void connectGoogle()}
              disabled={authBusy}
              style={{
                marginTop: 10,
                alignItems: 'center',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#fcd34d',
                backgroundColor: WS.card,
                paddingVertical: 10,
              }}
            >
              <Text style={{ fontWeight: '700', color: '#92400e' }}>
                {authBusy ? 'Opening…' : 'Connect Google Calendar'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <WorkshopFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search events…"
          resultCount={filtered.length}
          activeFilterCount={countActiveFilters([statusFilter, typeFilter])}
          onResetFilters={() => {
            setStatusFilter('all');
            setTypeFilter('all');
          }}
        >
          <WorkshopChipSelect
            label="Status"
            options={STATUS_OPTS.map((o) => o.value)}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <WorkshopChipSelect
            label="Type"
            options={TYPE_OPTS.map((o) => o.value)}
            value={typeFilter}
            onChange={setTypeFilter}
          />
        </WorkshopFilterBar>

        {loading && events.length === 0 ? (
          <WorkshopLoading />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(x) => x.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={WS.primary}
              />
            }
            renderItem={({ item }) => (
              <WorkshopListCard
                icon="calendar"
                iconColor="#4f46e5"
                iconBg="#eef2ff"
                title={item.title}
                subtitle={item.startDate ? new Date(item.startDate).toLocaleString() : ''}
                meta={`${label(item.status)} · ${label(item.eventType)}`}
                badges={[{ label: item.status, tone: 'status' }]}
                actions={[
                  { icon: 'videocam-outline', onPress: () => void onJoin(item) },
                  { icon: 'exit-outline', onPress: () => void onLeave(item.id) },
                  ...(canManageEvents()
                    ? [{ icon: 'trash-outline' as const, onPress: () => onDelete(item), danger: true }]
                    : []),
                ]}
              />
            )}
            ListEmptyComponent={
              <WorkshopEmptyState
                icon="calendar-outline"
                title="No events"
                subtitle="Schedule meetings and deadlines."
                actionLabel={canManageEvents() ? 'New event' : undefined}
                onAction={canManageEvents() ? openCreate : undefined}
              />
            }
          />
        )}
      </WorkshopChrome>

      <MobileFormSheet
        visible={createOpen}
        title="New event"
        onCancel={() => setCreateOpen(false)}
        onSave={() => void submitCreate()}
        saveLabel={createBusy ? 'Creating…' : 'Create'}
        saveLoading={createBusy}
      >
        <WorkshopFieldLabel>Title</WorkshopFieldLabel>
        <WorkshopTextInput value={title} onChangeText={setTitle} />
        <WorkshopFieldLabel>Description</WorkshopFieldLabel>
        <WorkshopTextInput
          value={description}
          onChangeText={setDescription}
          multiline
          style={{ minHeight: 64 }}
        />
        <WorkshopPickerField
          label="Type"
          value={label(eventType)}
          onPress={() => setTypePickOpen(true)}
        />
        <WorkshopDatePickerField label="Start date" value={startDate} onChange={setStartDate} />
        <WorkshopFieldLabel>Start time</WorkshopFieldLabel>
        <WorkshopTextInput
          value={startTime}
          onChangeText={setStartTime}
          placeholder="HH:MM"
        />
        <WorkshopDatePickerField label="End date" value={endDate} onChange={setEndDate} />
        <WorkshopFieldLabel>End time</WorkshopFieldLabel>
        <WorkshopTextInput
          value={endTime}
          onChangeText={setEndTime}
          placeholder="HH:MM"
        />
        <WorkshopFieldLabel>Location</WorkshopFieldLabel>
        <WorkshopTextInput value={location} onChangeText={setLocation} />
        <WorkshopFieldLabel>Participants (emails, comma)</WorkshopFieldLabel>
        <WorkshopTextInput value={participants} onChangeText={setParticipants} />
        <Pressable
          onPress={() => setIsOnline((v) => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
        >
          <Ionicons
            name={isOnline ? 'checkbox' : 'square-outline'}
            size={24}
            color={isOnline ? WS.primary : WS.textLight}
          />
          <Text style={{ marginLeft: 10, color: WS.text }}>Online meeting</Text>
        </Pressable>
      </MobileFormSheet>

      <OptionSheet
        visible={typePickOpen}
        title="Event type"
        options={typeFormOptions.map((o) => ({
          value: o.value,
          label: o.label,
        }))}
        onSelect={(v) => {
          setEventType(v);
          setTypePickOpen(false);
        }}
        onClose={() => setTypePickOpen(false)}
      />
    </>
  );
}
