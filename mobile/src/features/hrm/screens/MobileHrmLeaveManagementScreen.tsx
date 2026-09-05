import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import {
  getLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
  getEmployees,
} from '../../../services/hrm/hrmMobileApi';
import type { LeaveRequest, Employee } from '../../../models/hrm';
import { LeaveType, LeaveStatus } from '../../../models/hrm';
import {
  WorkshopChrome,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopDatePickerField,
  WorkshopChipSelect,
  WorkshopPickerField,
  WorkshopPrimaryButton,
  WorkshopOutlineButton,
  WorkshopDetailRow,
  WS,
} from '../../workshop/components/WorkshopChrome';

const LEAVE_TYPES = Object.values(LeaveType);

export function MobileHrmLeaveManagementScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageHRM } = usePermissions();
  const [rows, setRows] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [empId, setEmpId] = useState('');
  const [leaveType, setLeaveType] = useState(LeaveType.ANNUAL);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalDays, setTotalDays] = useState('1');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<LeaveRequest | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [lr, em] = await Promise.all([
        getLeaveRequests(1, 100),
        getEmployees(1, 100),
      ]);
      setRows(lr.leaveRequests ?? []);
      const list = em.employees ?? [];
      setEmployees(list);
      setEmpId((prev) => prev || list[0]?.id || '');
    } catch (e) {
      appError('HRM', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard'
        ? '/dashboard'
        : '/hrm/leave-management',
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

  const submit = async () => {
    if (!empId || !startDate.trim() || !endDate.trim() || !reason.trim()) {
      appAlert('HRM', 'Employee, dates, and reason are required.');
      return;
    }
    const td = parseFloat(totalDays);
    if (!Number.isFinite(td) || td <= 0) {
      appAlert('HRM', 'Enter valid total days.');
      return;
    }
    setSaving(true);
    try {
      await createLeaveRequest({
        employeeId: empId,
        leaveType,
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        totalDays: td,
        reason: reason.trim(),
        status: LeaveStatus.PENDING,
      });
      setOpen(false);
      setReason('');
      setTotalDays('1');
      await load();
    } catch (e) {
      appError('HRM', extractErrorMessage(e, 'Failed to submit'));
    } finally {
      setSaving(false);
    }
  };

  const approve = async (r: LeaveRequest) => {
    try {
      await updateLeaveRequest(r.id, { status: LeaveStatus.APPROVED });
      setDetail(null);
      await load();
    } catch (e) {
      appError('HRM', extractErrorMessage(e, 'Failed to update'));
    }
  };

  const remove = (r: LeaveRequest) => {
    appConfirm({
      title: 'Delete leave request',
      message: r.id,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteLeaveRequest(r.id);
          setDetail(null);
          await load();
        } catch (err) {
          appError('HRM', extractErrorMessage(err, 'Failed to delete'));
        }
      },
    });
  };

  const employeeLabel = (id: string) => {
    const e = employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.lastName}` : 'Select employee';
  };

  const cycleEmployee = () => {
    if (!employees.length) return;
    const ids = employees.map((e) => e.id);
    const idx = ids.indexOf(empId);
    setEmpId(ids[(idx + 1) % ids.length] || ids[0]);
  };

  return (
    <WorkshopChrome
      title="Leave"
      subtitle="Requests & approvals"
      right={canManageHRM() ? <WorkshopHeaderButton onPress={() => setOpen(true)} /> : undefined}
      scroll={false}
    >
      {loading && !refreshing ? (
        <WorkshopLoading />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WS.primary} />
          }
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="calendar-outline"
              title="No leave requests"
              subtitle="Submit and track employee leave."
              actionLabel={canManageHRM() ? 'New request' : undefined}
              onAction={canManageHRM() ? () => setOpen(true) : undefined}
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="calendar"
              iconColor="#0891b2"
              iconBg="#ecfeff"
              title={String(item.leaveType)}
              subtitle={`${item.startDate} → ${item.endDate}`}
              meta={`${item.totalDays} day${item.totalDays === 1 ? '' : 's'}`}
              badges={[{ label: String(item.status), tone: 'status' }]}
              onPress={() => setDetail(item)}
              actions={
                canManageHRM()
                  ? [
                      ...(item.status === LeaveStatus.PENDING
                        ? [{ icon: 'checkmark-outline' as const, label: 'Approve', onPress: () => void approve(item) }]
                        : []),
                      { icon: 'trash-outline', onPress: () => remove(item), danger: true },
                    ]
                  : undefined
              }
            />
          )}
        />
      )}

      <WorkshopFormSheet
        visible={open}
        title="New leave request"
        onClose={() => setOpen(false)}
        footer={
          <>
            <WorkshopPrimaryButton label={saving ? 'Submitting…' : 'Submit request'} onPress={() => void submit()} disabled={saving} />
            <Pressable onPress={() => setOpen(false)} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        <WorkshopPickerField
          label="Employee"
          value={employeeLabel(empId)}
          onPress={cycleEmployee}
        />
        <WorkshopChipSelect
          label="Leave type"
          options={[...LEAVE_TYPES]}
          value={leaveType}
          onChange={(v) => setLeaveType(v as LeaveType)}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="Start date" value={startDate} onChange={setStartDate} />
          </View>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="End date" value={endDate} onChange={setEndDate} />
          </View>
        </View>
        <WorkshopFieldLabel>Total days</WorkshopFieldLabel>
        <WorkshopTextInput value={totalDays} onChangeText={setTotalDays} keyboardType="decimal-pad" />
        <WorkshopFieldLabel>Reason</WorkshopFieldLabel>
        <WorkshopTextInput value={reason} onChangeText={setReason} multiline />
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={detail != null}
        title="Leave request"
        onClose={() => setDetail(null)}
        footer={
          <>
            {detail && detail.status === LeaveStatus.PENDING && canManageHRM() ? (
              <View style={{ marginBottom: 8 }}>
                <WorkshopPrimaryButton label="Approve" onPress={() => void approve(detail)} />
              </View>
            ) : null}
            {detail && canManageHRM() ? (
              <View style={{ marginBottom: 8 }}>
                <Pressable
                  onPress={() => remove(detail)}
                  style={{ alignItems: 'center', borderRadius: 14, paddingVertical: 15, backgroundColor: WS.dangerBg }}
                >
                  <Text style={{ fontWeight: '700', fontSize: 16, color: WS.danger }}>Delete</Text>
                </Pressable>
              </View>
            ) : null}
            <WorkshopOutlineButton label="Close" onPress={() => setDetail(null)} />
          </>
        }
      >
        {detail ? (
          <>
            <WorkshopDetailRow label="Type" value={String(detail.leaveType)} />
            <WorkshopDetailRow label="Status" value={String(detail.status)} />
            <WorkshopDetailRow label="Employee" value={employeeLabel(detail.employeeId)} />
            <WorkshopDetailRow label="Dates" value={`${detail.startDate} → ${detail.endDate}`} />
            <WorkshopDetailRow label="Days" value={String(detail.totalDays)} />
            <Text style={{ fontSize: 14, color: WS.textMuted, marginTop: 12, lineHeight: 20 }}>{detail.reason}</Text>
          </>
        ) : null}
      </WorkshopFormSheet>
    </WorkshopChrome>
  );
}
