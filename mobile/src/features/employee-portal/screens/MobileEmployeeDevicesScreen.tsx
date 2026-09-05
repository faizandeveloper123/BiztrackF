import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appError } from '../../../utils/appDialog';
import { getPortalDevices } from '../../../services/employeePortal/employeePortalMobileApi';
import type { EmployeeDevice } from '../../../models/employeePortal';
import {
  WorkshopChrome,
  WorkshopLoading,
  WorkshopBadge,
  WorkshopEmptyState,
  WorkshopDetailRow,
  WS,
} from '../../workshop/components/WorkshopChrome';
import { Ionicons } from '@expo/vector-icons';

function deviceIcon(type: string) {
  if (type === 'phone') return 'phone-portrait-outline' as const;
  if (type === 'tablet') return 'tablet-portrait-outline' as const;
  return 'laptop-outline' as const;
}

export function MobileEmployeeDevicesScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [devices, setDevices] = useState<EmployeeDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPortalDevices();
      setDevices(res.devices ?? []);
    } catch (e) {
      appError('Devices', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath('/employee-portal/devices');
  }, [setSidebarActivePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading && devices.length === 0) return <WorkshopLoading />;

  return (
    <View style={{ flex: 1, backgroundColor: WS.bg }}>
      <WorkshopChrome title="My devices" subtitle="Equipment assigned to you" scroll={false}>
        <FlatList
          style={{ flex: 1 }}
          data={devices}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={WS.primary} />
          }
          ListEmptyComponent={
            <WorkshopEmptyState icon="laptop-outline" title="No devices" subtitle="Nothing assigned yet." />
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-xl border border-slate-200 bg-white p-4">
              <View className="flex-row items-center gap-3">
                <View className="rounded-lg bg-indigo-50 p-2">
                  <Ionicons name={deviceIcon(item.deviceType)} size={24} color="#4f46e5" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-slate-900">{item.name}</Text>
                  <Text className="text-xs text-slate-500">{item.model ?? item.deviceType}</Text>
                </View>
                <WorkshopBadge label={item.status} />
              </View>
              {item.serialNumber ? <WorkshopDetailRow label="Serial" value={item.serialNumber} /> : null}
              {item.assignedAt ? (
                <WorkshopDetailRow label="Assigned" value={item.assignedAt.slice(0, 10)} />
              ) : null}
              {item.notes ? <Text className="mt-2 text-sm text-slate-500">{item.notes}</Text> : null}
            </View>
          )}
        />
      </WorkshopChrome>
    </View>
  );
}
