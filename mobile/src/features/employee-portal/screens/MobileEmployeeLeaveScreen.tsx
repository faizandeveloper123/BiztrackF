import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appError } from '../../../utils/appDialog';
import {
  getPortalLeaveRequests,
  createPortalLeaveRequest,
} from '../../../services/employeePortal/employeePortalMobileApi';
import type { LeaveRequest } from '../../../models/hrm';
import { LeaveType } from '../../../models/hrm';
import {
  WorkshopChrome,
  WorkshopLoading,
  WorkshopFAB,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopDatePickerField,
  WorkshopChipSelect,
  WorkshopPrimaryButton,
  WorkshopBadge,
  WorkshopEmptyState,
  WorkshopSegmentTabs,
  WS,
} from '../../workshop/components/WorkshopChrome';

const LEAVE_TYPES = Object.values(LeaveType);
const TABS = ['all', 'pending', 'approved', 'rejected'] as const;

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function MobileEmployeeLeaveScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [rows, setRows] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>('all');
  const [open, setOpen] = useState(false);
  const [leaveType, setLeaveType] = useState(LeaveType.ANNUAL);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalDays, setTotalDays] = useState('1');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const status = tab === 'all' ? undefined : tab;
      const res = await getPortalLeaveRequests(status);
      setRows(res.leaveRequests ?? []);
    } catch (e) {
      appError('Leave', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    setSidebarActivePath('/employee-portal/leave');
  }, [setSidebarActivePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const submit = async () => {
    if (!startDate || !endDate || !reason.trim()) {
      appAlert('Leave', 'Dates and reason are required');
      return;
    }
    const td = parseFloat(totalDays);
    if (!Number.isFinite(td) || td <= 0) {
      appAlert('Leave', 'Enter valid total days');
      return;
    }
    setSaving(true);
    try {
      await createPortalLeaveRequest({
        leaveType,
        startDate,
        endDate,
        totalDays: td,
        reason: reason.trim(),
      });
      setOpen(false);
      setReason('');
      await load();
      appAlert('Leave', 'Request submitted');
    } catch (e) {
      appError('Leave', extractErrorMessage(e, 'Failed to submit'));
    } finally {
      setSaving(false);
    }
  };

  if (loading && rows.length === 0) return <WorkshopLoading />;

  return (
    <View style={{ flex: 1, backgroundColor: WS.bg }}>
      <WorkshopChrome title="Leave" subtitle="Request and track leave" scroll={false}>
        <WorkshopSegmentTabs
          tabs={TABS.map((t) => ({ key: t, label: capitalize(t) }))}
          active={tab}
          onChange={(k) => setTab(k)}
        />
        <FlatList
          style={{ flex: 1 }}
          data={rows}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={WS.primary} />
          }
          contentContainerStyle={{ paddingBottom: 80 }}
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="calendar-outline"
              title="No leave requests"
              subtitle="Submit a request to get started."
              actionLabel="Request leave"
              onAction={() => setOpen(true)}
            />
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-xl border border-slate-200 bg-white p-4">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold capitalize text-slate-900">{item.leaveType}</Text>
                <WorkshopBadge label={capitalize(item.status)} />
              </View>
              <Text className="mt-2 text-sm text-slate-600">
                {item.startDate?.slice(0, 10)} – {item.endDate?.slice(0, 10)} · {item.totalDays} days
              </Text>
              {item.reason ? (
                <Text className="mt-1 text-sm text-slate-500">{item.reason}</Text>
              ) : null}
            </View>
          )}
        />
      </WorkshopChrome>
      <WorkshopFAB onPress={() => setOpen(true)} />
      <WorkshopFormSheet
        visible={open}
        title="Request leave"
        onClose={() => setOpen(false)}
        footer={
          <>
            <WorkshopPrimaryButton
              label={saving ? 'Submitting...' : 'Submit request'}
              onPress={() => void submit()}
              disabled={saving}
            />
            <Pressable onPress={() => setOpen(false)} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        <WorkshopChipSelect
          label="Type"
          options={[...LEAVE_TYPES]}
          value={leaveType}
          onChange={(v) => setLeaveType(v as LeaveType)}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="Start" value={startDate} onChange={setStartDate} />
          </View>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="End" value={endDate} onChange={setEndDate} />
          </View>
        </View>
        <WorkshopFieldLabel>Total days</WorkshopFieldLabel>
        <WorkshopTextInput value={totalDays} onChangeText={setTotalDays} keyboardType="decimal-pad" />
        <WorkshopFieldLabel>Reason</WorkshopFieldLabel>
        <WorkshopTextInput value={reason} onChangeText={setReason} multiline />
      </WorkshopFormSheet>
    </View>
  );
}
