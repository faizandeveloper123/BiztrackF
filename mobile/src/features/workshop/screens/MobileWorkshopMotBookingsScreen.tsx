import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  getMotBookings,
  getMotBookingStats,
  deleteMotBooking,
  type MotBooking,
  type MotBookingStats,
} from '../../../services/workshop/motMobileApi';
import {
  WorkshopChrome,
  WorkshopChipSelect,
  WorkshopFilterBar,
  countActiveFilters,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopStatCard,
  WS,
} from '../components/WorkshopChrome';

const STATUSES = [
  'all',
  'scheduled',
  'confirmed',
  'in_progress',
  'passed',
  'failed',
  'cancelled',
  'no_show',
];

const emptyStats: MotBookingStats = {
  total_bookings: 0,
  today_bookings: 0,
  upcoming_week: 0,
  scheduled_count: 0,
  confirmed_count: 0,
  in_progress_count: 0,
  passed_count: 0,
  failed_count: 0,
  cancelled_count: 0,
};

export function MobileWorkshopMotBookingsScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [list, setList] = useState<MotBooking[]>([]);
  const [stats, setStats] = useState<MotBookingStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('all');

  useEffect(() => {
    setSidebarActivePath('/workshop-management/mot/bookings');
  }, [setSidebarActivePath]);

  const load = useCallback(async () => {
    const [bookingsRes, statsRes] = await Promise.all([
      getMotBookings({ status: statusF, search: search.trim() || undefined }),
      getMotBookingStats().catch(() => emptyStats),
    ]);
    setList(bookingsRes.bookings ?? []);
    setStats(statsRes);
  }, [statusF, search]);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch (e) {
        appError('MOT bookings', extractErrorMessage(e, 'Failed to load'));
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

  const remove = (b: MotBooking) => {
    appConfirm({
      title: 'Delete',
      message: `Remove booking for ${b.customer_name}?`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteMotBooking(b.id);
          await run(false);
        } catch (e) {
          appError('MOT', extractErrorMessage(e, 'Delete failed'));
        }
      },
    });
  };

  const vehicle = (b: MotBooking) =>
    [b.vehicle_registration, b.vehicle_make, b.vehicle_model].filter(Boolean).join(' · ') || '—';

  return (
    <WorkshopChrome
      title="MOT bookings"
      subtitle="Test appointments & results"
      right={<View style={{ width: 72 }} />}
      scroll={false}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <View style={{ width: '48%' }}>
          <WorkshopStatCard
            label="Today"
            value={stats.today_bookings}
            sub="Bookings"
            icon="today"
            accent="#4f46e5"
            accentBg="#eef2ff"
          />
        </View>
        <View style={{ width: '48%' }}>
          <WorkshopStatCard
            label="This week"
            value={stats.upcoming_week}
            sub="Upcoming"
            icon="calendar"
            accent="#2563eb"
            accentBg="#eff6ff"
          />
        </View>
      </View>

      <WorkshopFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customer, reg…"
        resultCount={list.length}
        activeFilterCount={countActiveFilters([statusF])}
        onResetFilters={() => setStatusF('all')}
      >
        <WorkshopChipSelect
          label="Status"
          options={STATUSES}
          value={statusF}
          onChange={setStatusF}
        />
      </WorkshopFilterBar>

      {loading && !refreshing ? (
        <WorkshopLoading />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={list}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void run(true)}
              tintColor={WS.primary}
            />
          }
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="car-sport-outline"
              title="No MOT bookings"
              subtitle="Bookings from your MOT portal will appear here."
            />
          }
          renderItem={({ item: b }) => (
            <WorkshopListCard
              kind="mot"
              icon="car-sport"
              iconColor="#0d9488"
              iconBg="#ccfbf1"
              kicker={`${b.booking_date?.split('T')[0] ?? '—'} · ${b.start_time?.slice(0, 5) ?? ''}`}
              title={b.customer_name}
              subtitle={vehicle(b)}
              meta={b.test_type ? `Test · ${b.test_type}` : undefined}
              badges={[{ label: b.status, tone: 'status' }]}
              actions={[
                {
                  icon: 'trash-outline',
                  onPress: () => remove(b),
                  danger: true,
                },
              ]}
            />
          )}
        />
      )}
    </WorkshopChrome>
  );
}
