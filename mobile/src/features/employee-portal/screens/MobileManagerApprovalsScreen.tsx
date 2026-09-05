import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import {
  getEmployeePortalDashboard,
  reviewPortalLeaveRequest,
} from '../../../services/employeePortal/employeePortalMobileApi';
import type { PendingApproval } from '../../../models/employeePortal';
import {
  WorkshopChrome,
  WorkshopLoading,
  WorkshopBadge,
  WorkshopEmptyState,
  WorkshopPrimaryButton,
  WorkshopOutlineButton,
  WS,
} from '../../workshop/components/WorkshopChrome';

export function MobileManagerApprovalsScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [rows, setRows] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const d = await getEmployeePortalDashboard();
      setRows(d.pendingApprovals ?? []);
    } catch (e) {
      appError('Approvals', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath('/employee-portal/approvals');
  }, [setSidebarActivePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const review = (id: string, action: 'approve' | 'reject') => {
    const run = async () => {
      setBusyId(id);
      try {
        await reviewPortalLeaveRequest(id, action);
        await load();
        appAlert('Leave', action === 'approve' ? 'Approved' : 'Rejected');
      } catch (e) {
        appError('Leave', extractErrorMessage(e, 'Action failed'));
      } finally {
        setBusyId(null);
      }
    };
    if (action === 'reject') {
      appConfirm({
        title: 'Leave',
        message: 'Reject this request?',
        confirmLabel: 'Reject',
        destructive: true,
        onConfirm: run,
      });
      return;
    }
    void run();
  };

  if (loading && rows.length === 0) return <WorkshopLoading />;

  return (
    <View style={{ flex: 1, backgroundColor: WS.bg }}>
      <WorkshopChrome title="Approvals" subtitle="Pending leave requests" scroll={false}>
        <FlatList
          style={{ flex: 1 }}
          data={rows}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={WS.primary} />
          }
          ListEmptyComponent={
            <WorkshopEmptyState icon="checkmark-done-outline" title="All caught up" subtitle="No pending approvals." />
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-xl border border-slate-200 bg-white p-4">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-slate-900">{item.employeeName}</Text>
                <WorkshopBadge label={item.status} />
              </View>
              <Text className="mt-2 capitalize text-sm text-slate-600">
                {item.leaveType} · {item.totalDays} days
              </Text>
              <Text className="text-sm text-slate-500">
                {item.startDate?.slice(0, 10)} – {item.endDate?.slice(0, 10)}
              </Text>
              {item.reason ? <Text className="mt-2 text-sm text-slate-600">{item.reason}</Text> : null}
              <View className="mt-3 flex-row gap-2">
                <View className="flex-1">
                  <WorkshopOutlineButton
                    label={busyId === item.id ? '...' : 'Deny'}
                    onPress={() => review(item.id, 'reject')}
                  />
                </View>
                <View className="flex-1">
                  <WorkshopPrimaryButton
                    label={busyId === item.id ? '...' : 'Approve'}
                    onPress={() => review(item.id, 'approve')}
                    disabled={busyId === item.id}
                  />
                </View>
              </View>
            </View>
          )}
        />
      </WorkshopChrome>
    </View>
  );
}
