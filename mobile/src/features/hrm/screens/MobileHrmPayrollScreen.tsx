import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { getPayrollRecords, createPayrollRecord, updatePayrollRecord, deletePayrollRecord, getEmployees } from '../../../services/hrm/hrmMobileApi';
import type { Payroll, Employee, PayrollCreate, PayrollUpdate } from '../../../models/hrm';
import { PayrollStatus } from '../../../models/hrm';
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
  WorkshopPickerField,
  WorkshopChipSelect,
  WorkshopPrimaryButton,
  WorkshopOutlineButton,
  WorkshopDetailRow,
  WS,
} from '../../workshop/components/WorkshopChrome';

const PAYROLL_STATUSES = Object.values(PayrollStatus);

function todayIsoDate() {
  return new Date().toISOString().split('T')[0] || '';
}

export function MobileHrmPayrollScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageHRM } = usePermissions();
  const [rows, setRows] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<Payroll | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Payroll | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    payPeriod: '',
    startDate: todayIsoDate(),
    endDate: todayIsoDate(),
    basicSalary: '',
    allowances: '',
    deductions: '',
    overtimePay: '',
    bonus: '',
    netPay: '',
    status: PayrollStatus.DRAFT,
    paymentDate: todayIsoDate(),
    notes: '',
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [res, emp] = await Promise.all([getPayrollRecords(1, 100), getEmployees(1, 100)]);
      setRows(res.payroll ?? []);
      const list = emp.employees ?? [];
      setEmployees(list);
      setForm((prev) => ({ ...prev, employeeId: prev.employeeId || list[0]?.id || '' }));
    } catch (e) {
      appError('HRM', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/hrm/payroll',
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

  const employeeName = (id: string) => {
    const employee = employees.find((e) => e.id === id);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Select employee';
  };

  const cycleEmployee = () => {
    if (!employees.length) return;
    setForm((prev) => {
      const ids = employees.map((e) => e.id);
      const idx = ids.indexOf(prev.employeeId);
      return { ...prev, employeeId: ids[(idx + 1) % ids.length] || ids[0] };
    });
  };

  const openCreate = () => {
    const employeeId = employees[0]?.id || '';
    setForm({
      employeeId,
      payPeriod: '',
      startDate: todayIsoDate(),
      endDate: todayIsoDate(),
      basicSalary: '',
      allowances: '',
      deductions: '',
      overtimePay: '',
      bonus: '',
      netPay: '',
      status: PayrollStatus.DRAFT,
      paymentDate: todayIsoDate(),
      notes: '',
    });
    setCreateOpen(true);
  };

  const openEdit = (row: Payroll) => {
    setSelected(row);
    setForm({
      employeeId: row.employeeId,
      payPeriod: row.payPeriod,
      startDate: row.startDate ? row.startDate.split('T')[0] || row.startDate : todayIsoDate(),
      endDate: row.endDate ? row.endDate.split('T')[0] || row.endDate : todayIsoDate(),
      basicSalary: String(row.basicSalary),
      allowances: String(row.allowances || 0),
      deductions: String(row.deductions || 0),
      overtimePay: String(row.overtimePay || 0),
      bonus: String(row.bonus || 0),
      netPay: String(row.netPay),
      status: row.status,
      paymentDate: row.paymentDate ? row.paymentDate.split('T')[0] || row.paymentDate : todayIsoDate(),
      notes: row.notes || '',
    });
    setEditOpen(true);
  };

  const parseNumber = (value: string) => {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  };

  const validateForm = () => {
    if (!form.employeeId || !form.payPeriod.trim() || !form.startDate.trim() || !form.endDate.trim()) {
      appAlert('HRM', 'Employee, pay period, start date, and end date are required.');
      return false;
    }
    if (parseNumber(form.basicSalary) <= 0) {
      appAlert('HRM', 'Basic salary must be greater than zero.');
      return false;
    }
    return true;
  };

  const buildPayload = (): PayrollCreate => {
    const basicSalary = parseNumber(form.basicSalary);
    const allowances = parseNumber(form.allowances);
    const deductions = parseNumber(form.deductions);
    const overtimePay = parseNumber(form.overtimePay);
    const bonus = parseNumber(form.bonus);
    const calculatedNet = basicSalary + allowances + overtimePay + bonus - deductions;
    const netPay = form.netPay.trim() ? parseNumber(form.netPay) : calculatedNet;
    return {
      employeeId: form.employeeId,
      payPeriod: form.payPeriod.trim(),
      startDate: form.startDate.trim(),
      endDate: form.endDate.trim(),
      basicSalary,
      allowances,
      deductions,
      overtimePay,
      bonus,
      netPay,
      status: form.status,
      paymentDate: form.paymentDate.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
  };

  const submitCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await createPayrollRecord(buildPayload());
      setCreateOpen(false);
      await load();
    } catch (e) {
      appError('HRM', extractErrorMessage(e, 'Failed to create'));
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async () => {
    if (!selected || !validateForm()) return;
    setSaving(true);
    try {
      const payload = buildPayload();
      const updatePayload: PayrollUpdate = {
        payPeriod: payload.payPeriod,
        startDate: payload.startDate,
        endDate: payload.endDate,
        basicSalary: payload.basicSalary,
        allowances: payload.allowances,
        deductions: payload.deductions,
        overtimePay: payload.overtimePay,
        bonus: payload.bonus,
        netPay: payload.netPay,
        status: payload.status,
        paymentDate: payload.paymentDate,
        notes: payload.notes,
      };
      await updatePayrollRecord(selected.id, updatePayload);
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      appError('HRM', extractErrorMessage(e, 'Failed to update'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (row: Payroll) => {
    appConfirm({
      title: 'Delete payroll record',
      message: row.payPeriod,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deletePayrollRecord(row.id);
          setDetail(null);
          await load();
        } catch (err) {
          appError('HRM', extractErrorMessage(err, 'Failed to delete'));
        }
      },
    });
  };

  const renderForm = () => (
    <>
      <WorkshopPickerField label="Employee" value={employeeName(form.employeeId)} onPress={cycleEmployee} />
      <WorkshopFieldLabel>Pay period *</WorkshopFieldLabel>
      <WorkshopTextInput value={form.payPeriod} onChangeText={(v) => setForm((p) => ({ ...p, payPeriod: v }))} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <WorkshopDatePickerField label="Start date *" value={form.startDate} onChange={(v) => setForm((p) => ({ ...p, startDate: v }))} />
        </View>
        <View style={{ flex: 1 }}>
          <WorkshopDatePickerField label="End date *" value={form.endDate} onChange={(v) => setForm((p) => ({ ...p, endDate: v }))} />
        </View>
      </View>
      <WorkshopFieldLabel>Basic salary *</WorkshopFieldLabel>
      <WorkshopTextInput value={form.basicSalary} onChangeText={(v) => setForm((p) => ({ ...p, basicSalary: v }))} keyboardType="decimal-pad" />
      <WorkshopFieldLabel>Allowances</WorkshopFieldLabel>
      <WorkshopTextInput value={form.allowances} onChangeText={(v) => setForm((p) => ({ ...p, allowances: v }))} keyboardType="decimal-pad" />
      <WorkshopFieldLabel>Deductions</WorkshopFieldLabel>
      <WorkshopTextInput value={form.deductions} onChangeText={(v) => setForm((p) => ({ ...p, deductions: v }))} keyboardType="decimal-pad" />
      <WorkshopFieldLabel>Overtime pay</WorkshopFieldLabel>
      <WorkshopTextInput value={form.overtimePay} onChangeText={(v) => setForm((p) => ({ ...p, overtimePay: v }))} keyboardType="decimal-pad" />
      <WorkshopFieldLabel>Bonus</WorkshopFieldLabel>
      <WorkshopTextInput value={form.bonus} onChangeText={(v) => setForm((p) => ({ ...p, bonus: v }))} keyboardType="decimal-pad" />
      <WorkshopFieldLabel>Net pay (optional)</WorkshopFieldLabel>
      <WorkshopTextInput value={form.netPay} onChangeText={(v) => setForm((p) => ({ ...p, netPay: v }))} keyboardType="decimal-pad" />
      <WorkshopChipSelect label="Status" options={[...PAYROLL_STATUSES]} value={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v as PayrollStatus }))} />
      <WorkshopDatePickerField label="Payment date" value={form.paymentDate} onChange={(v) => setForm((p) => ({ ...p, paymentDate: v }))} />
      <WorkshopFieldLabel>Notes</WorkshopFieldLabel>
      <WorkshopTextInput value={form.notes} onChangeText={(v) => setForm((p) => ({ ...p, notes: v }))} multiline />
    </>
  );

  const formFooter = (onSave: () => void, saveLabel: string, onCancel: () => void) => (
    <>
      <WorkshopPrimaryButton label={saving ? 'Saving…' : saveLabel} onPress={onSave} disabled={saving} />
      <Pressable onPress={onCancel} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
        <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
      </Pressable>
    </>
  );

  return (
    <WorkshopChrome
      title="Payroll"
      subtitle="Pay periods & compensation"
      right={canManageHRM() ? <WorkshopHeaderButton onPress={openCreate} /> : undefined}
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
              icon="wallet-outline"
              title="No payroll records"
              subtitle="Create payroll records for your team."
              actionLabel={canManageHRM() ? 'New record' : undefined}
              onAction={canManageHRM() ? openCreate : undefined}
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="wallet"
              iconColor="#d97706"
              iconBg="#fffbeb"
              title={item.payPeriod}
              subtitle={`Net ${formatUsd(item.netPay)}`}
              meta={`${item.startDate} → ${item.endDate}`}
              badges={[{ label: String(item.status), tone: 'status' }]}
              onPress={() => setDetail(item)}
              actions={
                canManageHRM()
                  ? [
                      { icon: 'create-outline', onPress: () => openEdit(item) },
                      { icon: 'trash-outline', onPress: () => remove(item), danger: true },
                    ]
                  : undefined
              }
            />
          )}
        />
      )}

      <WorkshopFormSheet
        visible={detail != null}
        title="Payroll"
        onClose={() => setDetail(null)}
        footer={
          <>
            {detail && canManageHRM() ? (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <WorkshopPrimaryButton label="Edit" onPress={() => { setDetail(null); openEdit(detail); }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Pressable
                    onPress={() => remove(detail)}
                    style={{ alignItems: 'center', borderRadius: 14, paddingVertical: 15, backgroundColor: WS.dangerBg }}
                  >
                    <Text style={{ fontWeight: '700', fontSize: 16, color: WS.danger }}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            <WorkshopOutlineButton label="Close" onPress={() => setDetail(null)} />
          </>
        }
      >
        {detail ? (
          <>
            <WorkshopDetailRow label="Pay period" value={detail.payPeriod} />
            <WorkshopDetailRow label="Employee" value={employeeName(detail.employeeId)} />
            <WorkshopDetailRow label="Basic" value={formatUsd(detail.basicSalary)} />
            <WorkshopDetailRow label="Net pay" value={formatUsd(detail.netPay)} />
            <WorkshopDetailRow label="Status" value={String(detail.status)} />
            <WorkshopDetailRow label="Dates" value={`${detail.startDate} → ${detail.endDate}`} />
          </>
        ) : null}
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={createOpen}
        title="New payroll record"
        onClose={() => setCreateOpen(false)}
        footer={formFooter(() => void submitCreate(), 'Create record', () => setCreateOpen(false))}
      >
        {renderForm()}
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={editOpen}
        title="Edit payroll record"
        onClose={() => { setEditOpen(false); setSelected(null); }}
        footer={formFooter(() => void submitEdit(), 'Save record', () => { setEditOpen(false); setSelected(null); })}
      >
        {renderForm()}
      </WorkshopFormSheet>
    </WorkshopChrome>
  );
}
