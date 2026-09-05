import { useCallback, useEffect, useState } from 'react';
import { Alert, View, Text } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { getInventoryDashboard } from '../../../services/inventory/inventoryMobileApi';
import type { InventoryDashboardStats } from '../../../models/inventory';
import { ModuleHubScreen, type HubLink, type HubStat } from '../../../components/layout/ModuleHubScreen';
import { WS } from '../../workshop/components/workshopTheme';

const LINKS: HubLink[] = [
  { path: '/inventory/warehouses', label: 'Warehouses', icon: 'business', color: '#4f46e5', bg: '#eef2ff' },
  { path: '/inventory/storage-locations', label: 'Storage', icon: 'location', color: '#2563eb', bg: '#eff6ff' },
  { path: '/inventory/stock-movements', label: 'Movements', icon: 'swap-horizontal', color: '#0891b2', bg: '#ecfeff' },
  { path: '/inventory/purchase-orders', label: 'Purchase orders', icon: 'clipboard', color: '#7c3aed', bg: '#f5f3ff' },
  { path: '/inventory/receiving', label: 'Receiving', icon: 'checkmark-done', color: '#059669', bg: '#ecfdf5' },
  { path: '/inventory/products', label: 'Products', icon: 'cube', color: '#d97706', bg: '#fffbeb' },
  { path: '/inventory/alerts', label: 'Alerts', icon: 'warning', color: '#ef4444', bg: '#fef2f2' },
  { path: '/inventory/dumps', label: 'Dumps', icon: 'trash', color: '#64748b', bg: '#f1f5f9' },
  { path: '/inventory/customer-returns', label: 'Customer returns', icon: 'return-down-back', color: '#4f46e5', bg: '#eef2ff' },
  { path: '/inventory/supplier-returns', label: 'Supplier returns', icon: 'return-up-forward', color: '#2563eb', bg: '#eff6ff' },
];

export function MobileInventoryDashboardScreen() {
  const { workspacePath, setSidebarActivePath, navigateMenuPath } =
    useSidebarDrawer();
  const [stats, setStats] = useState<InventoryDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const d = await getInventoryDashboard();
      setStats(d);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/inventory',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const hubStats: HubStat[] = stats
    ? [
        { label: 'Products', value: stats.totalProducts, sub: `${stats.lowStockProducts} low stock`, icon: 'cube', accent: '#4f46e5', accentBg: '#eef2ff' },
        { label: 'Out of stock', value: stats.outOfStockProducts, sub: 'Needs reorder', icon: 'alert-circle', accent: '#ef4444', accentBg: '#fef2f2' },
        { label: 'Warehouses', value: stats.totalWarehouses, sub: `${stats.totalSuppliers} suppliers`, icon: 'business', accent: '#2563eb', accentBg: '#eff6ff' },
        { label: 'Stock value', value: formatUsd(stats.totalStockValue), sub: 'Total valuation', icon: 'cash', accent: '#059669', accentBg: '#ecfdf5' },
      ]
    : [];

  return (
    <ModuleHubScreen
      title="Inventory"
      subtitle="Stock, warehouses & products"
      accent={WS.primary}
      loading={loading}
      refreshing={refreshing}
      onRefresh={onRefresh}
      stats={hubStats}
      links={LINKS}
      onNavigate={(path) => void navigateMenuPath(path)}
      linksTitle="Inventory modules"
    >
      {stats ? (
        <View
          style={{
            marginTop: 16,
            backgroundColor: WS.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: WS.border,
            padding: 16,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: WS.text }}>Operations</Text>
          <Text style={{ marginTop: 8, fontSize: 14, color: WS.textMuted, lineHeight: 22 }}>
            Pending PO {stats.pendingPurchaseOrders} · Receivings {stats.pendingReceivings}
          </Text>
        </View>
      ) : null}
    </ModuleHubScreen>
  );
}
