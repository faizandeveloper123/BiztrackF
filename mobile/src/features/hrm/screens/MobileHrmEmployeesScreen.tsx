import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { getEmployees, deleteEmployee, createEmployee, updateEmployee } from '../../../services/hrm/hrmMobileApi';
import {
  createCustomDepartment,
  getCustomDepartments,
} from '../../../services/hrm/customOptionsMobileApi';
import type { Employee, EmployeeCreate, EmployeeUpdate } from '../../../models/hrm';
import { Department, EmployeeType, EmploymentStatus } from '../../../models/hrm';
import {
  WorkshopChrome,
  WorkshopSearchBar,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopDatePickerField,
  WorkshopChipSelect,
  WorkshopPrimaryButton,
  WorkshopOutlineButton,
  WorkshopDetailRow,
  WS,
} from '../../workshop/components/WorkshopChrome';

const DEPARTMENTS = Object.values(Department);
const EMPLOYEE_TYPES = Object.values(EmployeeType);
const EMPLOYMENT_STATUSES = Object.values(EmploymentStatus);
const CREATE_DEPT = '+ Create New Department';

function todayIsoDate() {
  return new Date().toISOString().split('T')[0] || '';
}

function buildEmptyForm() {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    hireDate: todayIsoDate(),
    employeeId: '',
    department: Department.GENERAL as string,
    position: '',
    employeeType: EmployeeType.FULL_TIME,
    employmentStatus: EmploymentStatus.ACTIVE,
    salary: '',
    notes: '',
  };
}

export function MobileHrmEmployeesScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageHRM } = usePermissions();
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<Employee | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(buildEmptyForm());
  const [customDepartments, setCustomDepartments] = useState<string[]>([]);
  const [createDeptOpen, setCreateDeptOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [creatingDept, setCreatingDept] = useState(false);

  const departmentOptions = (() => {
    const opts = [...DEPARTMENTS.map(String), ...customDepartments];
    if (
      form.department &&
      !opts.includes(form.department) &&
      form.department !== CREATE_DEPT
    ) {
      opts.push(form.department);
    }
    opts.push(CREATE_DEPT);
    return opts;
  })();

  const loadCustomDepartments = useCallback(async () => {
    try {
      const depts = await getCustomDepartments();
      setCustomDepartments(depts.map((d) => d.name).filter(Boolean));
    } catch {
      setCustomDepartments([]);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getEmployees(1, 100, q.trim() ? { search: q.trim() } : undefined);
      setRows(res.employees ?? []);
    } catch (e) {
      appError('HRM', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/hrm/employees',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadCustomDepartments();
  }, [loadCustomDepartments]);

  useEffect(() => {
    const t = setTimeout(() => void load(), q.trim() ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const remove = (e: Employee) => {
    appConfirm({
      title: 'Delete employee',
      message: `${e.firstName} ${e.lastName}`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteEmployee(e.id);
          setDetail(null);
          await load();
        } catch (err) {
          appError('HRM', extractErrorMessage(err, 'Failed to delete'));
        }
      },
    });
  };

  const openCreate = () => {
    setForm(buildEmptyForm());
    setCreateOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setSelected(employee);
    setForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone || '',
      hireDate: employee.hireDate || todayIsoDate(),
      employeeId: employee.employeeId,
      department: String(employee.department),
      position: employee.position,
      employeeType: employee.employeeType,
      employmentStatus: employee.employmentStatus,
      salary: employee.salary != null ? String(employee.salary) : '',
      notes: employee.notes || '',
    });
    setEditOpen(true);
  };

  const validateForm = () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      appAlert('HRM', 'First name, last name, and email are required.');
      return false;
    }
    if (!form.employeeId.trim() || !form.position.trim() || !form.hireDate.trim()) {
      appAlert('HRM', 'Employee ID, position, and hire date are required.');
      return false;
    }
    return true;
  };

  const submitCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const salaryValue = parseFloat(form.salary);
      const payload: EmployeeCreate = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        hireDate: form.hireDate.trim(),
        employeeId: form.employeeId.trim(),
        department: form.department as Department,
        position: form.position.trim(),
        employeeType: form.employeeType,
        employmentStatus: form.employmentStatus,
        salary: Number.isFinite(salaryValue) ? salaryValue : undefined,
        notes: form.notes.trim() || undefined,
      };
      await createEmployee(payload);
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
      const salaryValue = parseFloat(form.salary);
      const payload: EmployeeUpdate = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        hireDate: form.hireDate.trim(),
        employeeId: form.employeeId.trim(),
        department: form.department as Department,
        position: form.position.trim(),
        employeeType: form.employeeType,
        employmentStatus: form.employmentStatus,
        salary: Number.isFinite(salaryValue) ? salaryValue : undefined,
        notes: form.notes.trim() || undefined,
      };
      await updateEmployee(selected.id, payload);
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      appError('HRM', extractErrorMessage(e, 'Failed to update'));
    } finally {
      setSaving(false);
    }
  };

  const renderForm = () => (
    <>
      <WorkshopFieldLabel>First name *</WorkshopFieldLabel>
      <WorkshopTextInput value={form.firstName} onChangeText={(v) => setForm((p) => ({ ...p, firstName: v }))} />
      <WorkshopFieldLabel>Last name *</WorkshopFieldLabel>
      <WorkshopTextInput value={form.lastName} onChangeText={(v) => setForm((p) => ({ ...p, lastName: v }))} />
      <WorkshopFieldLabel>Email *</WorkshopFieldLabel>
      <WorkshopTextInput value={form.email} onChangeText={(v) => setForm((p) => ({ ...p, email: v }))} keyboardType="email-address" autoCapitalize="none" />
      <WorkshopFieldLabel>Phone</WorkshopFieldLabel>
      <WorkshopTextInput value={form.phone} onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))} />
      <WorkshopFieldLabel>Employee ID *</WorkshopFieldLabel>
      <WorkshopTextInput value={form.employeeId} onChangeText={(v) => setForm((p) => ({ ...p, employeeId: v }))} />
      <WorkshopFieldLabel>Position *</WorkshopFieldLabel>
      <WorkshopTextInput value={form.position} onChangeText={(v) => setForm((p) => ({ ...p, position: v }))} />
      <WorkshopDatePickerField label="Hire date *" value={form.hireDate} onChange={(v) => setForm((p) => ({ ...p, hireDate: v }))} />
      <WorkshopFieldLabel>Salary</WorkshopFieldLabel>
      <WorkshopTextInput value={form.salary} onChangeText={(v) => setForm((p) => ({ ...p, salary: v }))} keyboardType="decimal-pad" />
      <WorkshopChipSelect
        label="Department"
        options={departmentOptions}
        value={form.department}
        onChange={(v) => {
          if (v === CREATE_DEPT) {
            setNewDeptName('');
            setCreateDeptOpen(true);
            return;
          }
          setForm((p) => ({ ...p, department: v }));
        }}
      />
      <WorkshopChipSelect label="Type" options={[...EMPLOYEE_TYPES]} value={form.employeeType} onChange={(v) => setForm((p) => ({ ...p, employeeType: v as EmployeeType }))} />
      <WorkshopChipSelect label="Status" options={[...EMPLOYMENT_STATUSES]} value={form.employmentStatus} onChange={(v) => setForm((p) => ({ ...p, employmentStatus: v as EmploymentStatus }))} />
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
      title="Employees"
      subtitle="Team directory & profiles"
      right={canManageHRM() ? <WorkshopHeaderButton onPress={openCreate} /> : undefined}
      scroll={false}
    >
      <WorkshopSearchBar
        value={q}
        onChangeText={setQ}
        placeholder="Search name, email, position…"
      />

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
              icon="people-outline"
              title="No employees"
              subtitle="Add team members to your organization."
              actionLabel={canManageHRM() ? 'Add employee' : undefined}
              onAction={canManageHRM() ? openCreate : undefined}
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="person"
              iconColor="#4f46e5"
              iconBg="#eef2ff"
              title={`${item.firstName} ${item.lastName}`}
              subtitle={item.email}
              meta={`${String(item.department)} · ${item.position}`}
              badges={[{ label: String(item.employmentStatus), tone: 'status' }]}
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
        title="Employee"
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
            <Text style={{ fontSize: 22, fontWeight: '800', color: WS.text, marginBottom: 12 }}>
              {detail.firstName} {detail.lastName}
            </Text>
            <WorkshopDetailRow label="Email" value={detail.email} />
            <WorkshopDetailRow label="Employee ID" value={detail.employeeId} />
            <WorkshopDetailRow label="Department" value={String(detail.department)} />
            <WorkshopDetailRow label="Position" value={detail.position} />
            <WorkshopDetailRow label="Status" value={String(detail.employmentStatus)} />
            <WorkshopDetailRow label="Type" value={String(detail.employeeType)} />
            {detail.salary != null ? (
              <WorkshopDetailRow label="Salary" value={formatUsd(detail.salary)} />
            ) : null}
            {detail.hireDate ? (
              <WorkshopDetailRow label="Hired" value={detail.hireDate} />
            ) : null}
            {detail.notes ? (
              <Text style={{ fontSize: 14, color: WS.textMuted, marginTop: 12, lineHeight: 20 }}>{detail.notes}</Text>
            ) : null}
          </>
        ) : null}
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={createOpen}
        title="New employee"
        onClose={() => setCreateOpen(false)}
        footer={formFooter(() => void submitCreate(), 'Create employee', () => setCreateOpen(false))}
      >
        {renderForm()}
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={editOpen}
        title="Edit employee"
        onClose={() => { setEditOpen(false); setSelected(null); }}
        footer={formFooter(() => void submitEdit(), 'Save employee', () => { setEditOpen(false); setSelected(null); })}
      >
        {renderForm()}
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={createDeptOpen}
        title="New department"
        onClose={() => setCreateDeptOpen(false)}
        footer={
          <>
            <WorkshopPrimaryButton
              label={creatingDept ? 'Creating…' : 'Create department'}
              disabled={creatingDept}
              onPress={() => {
                void (async () => {
                  const name = newDeptName.trim();
                  if (!name) {
                    appAlert('HRM', 'Department name is required.');
                    return;
                  }
                  setCreatingDept(true);
                  try {
                    const created = await createCustomDepartment(name);
                    await loadCustomDepartments();
                    setForm((p) => ({ ...p, department: created.name || name }));
                    setCreateDeptOpen(false);
                    setNewDeptName('');
                  } catch (e) {
                    appError('HRM', extractErrorMessage(e, 'Failed to create department'));
                  } finally {
                    setCreatingDept(false);
                  }
                })();
              }}
            />
            <Pressable
              onPress={() => setCreateDeptOpen(false)}
              style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}
            >
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        <WorkshopFieldLabel>Department name *</WorkshopFieldLabel>
        <WorkshopTextInput
          value={newDeptName}
          onChangeText={setNewDeptName}
          placeholder="e.g. Field Operations"
        />
      </WorkshopFormSheet>
    </WorkshopChrome>
  );
}
