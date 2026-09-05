import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { getInventoryDashboard } from '../../../services/inventory/inventoryMobileApi';
import type { InventoryDashboardStats, StockAlert } from '../../../models/inventory';
import {
  WorkshopChrome,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopLoading,
  WorkshopStatCard,
  WS,
} from '../../workshop/components/WorkshopChrome';

export function MobileInventoryAlertsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const [stats, setStats] = useState<InventoryDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const d = await getInventoryDashboard();
    setStats(d);
  }, []);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch {
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [load],
  );

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/inventory/alerts',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void run(false);
  }, [run]);

  const alerts = stats?.lowStockAlerts ?? [];

  return (
    <WorkshopChrome
      title="Alerts"
      subtitle="Low stock & reorder warnings"
      right={<View style={{ width: 72 }} />}
      scroll={false}
    >
      {stats ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <View style={{ width: '48%' }}>
            <WorkshopStatCard
              label="Low stock"
              value={stats.lowStockProducts}
              sub="Below minimum"
              icon="warning"
              accent="#f59e0b"
              accentBg="#fffbeb"
            />
          </View>
          <View style={{ width: '48%' }}>
            <WorkshopStatCard
              label="Out of stock"
              value={stats.outOfStockProducts}
              sub="Needs reorder"
              icon="alert-circle"
              accent="#ef4444"
              accentBg="#fef2f2"
            />
          </View>
        </View>
      ) : null}

      {loading && !refreshing ? (
        <WorkshopLoading />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={alerts}
          keyExtractor={(item, i) => `${item.productId}-${i}`}
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
              icon="checkmark-circle-outline"
              title="No alerts"
              subtitle="All products are above minimum stock levels."
            />
          }
          renderItem={({ item }: { item: StockAlert }) => (
            <WorkshopListCard
              icon="warning"
              iconColor="#f59e0b"
              iconBg="#fffbeb"
              title={item.productName}
              subtitle={item.sku}
              meta={
                [item.message, `Current ${item.currentStock} · Min ${item.minStockLevel}`]
                  .filter(Boolean)
                  .join(' · ')
              }
              badges={[{ label: item.alertType, tone: 'priority' }]}
            />
          )}
        />
      )}
    </WorkshopChrome>
  );
}
