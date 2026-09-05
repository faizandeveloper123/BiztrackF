import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import { getJobPostings, deleteJobPosting, createJobPosting, updateJobPosting } from '../../../services/hrm/hrmMobileApi';
import type { JobPosting, JobPostingCreate, JobPostingUpdate } from '../../../models/hrm';
import { Department, EmployeeType, JobStatus } from '../../../models/hrm';
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
const JOB_STATUSES = Object.values(JobStatus);

function todayIsoDate() {
  return new Date().toISOString().split('T')[0] || '';
}

function buildEmptyForm() {
  return {
    title: '',
    department: Department.GENERAL,
    description: '',
    location: '',
    type: EmployeeType.FULL_TIME,
    salaryRange: '',
    status: JobStatus.DRAFT,
    openDate: todayIsoDate(),
    closeDate: '',
  };
}

export function MobileHrmJobPostingsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageHRM } = usePermissions();
  const [rows, setRows] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<JobPosting | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<JobPosting | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(buildEmptyForm());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getJobPostings(1, 100, q.trim() ? { search: q.trim() } : undefined);
      setRows(res.jobPostings ?? []);
    } catch (e) {
      appError('HRM', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/hrm/job-postings',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    const t = setTimeout(() => void load(), q.trim() ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const remove = (j: JobPosting) => {
    appConfirm({
      title: 'Delete job',
      message: j.title,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteJobPosting(j.id);
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

  const openEdit = (job: JobPosting) => {
    setSelected(job);
    setForm({
      title: job.title,
      department: job.department,
      description: job.description,
      location: job.location,
      type: job.type,
      salaryRange: job.salaryRange || '',
      status: job.status,
      openDate: job.openDate ? job.openDate.split('T')[0] || job.openDate : todayIsoDate(),
      closeDate: job.closeDate ? job.closeDate.split('T')[0] || job.closeDate : '',
    });
    setEditOpen(true);
  };

  const validateForm = () => {
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      appAlert('HRM', 'Title, description, and location are required.');
      return false;
    }
    if (!form.openDate.trim()) {
      appAlert('HRM', 'Open date is required.');
      return false;
    }
    return true;
  };

  const submitCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload: JobPostingCreate = {
        title: form.title.trim(),
        department: form.department,
        description: form.description.trim(),
        location: form.location.trim(),
        type: form.type,
        salaryRange: form.salaryRange.trim() || undefined,
        status: form.status,
        openDate: form.openDate.trim(),
        closeDate: form.closeDate.trim() || undefined,
      };
      await createJobPosting(payload);
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
      const payload: JobPostingUpdate = {
        title: form.title.trim(),
        department: form.department,
        description: form.description.trim(),
        location: form.location.trim(),
        type: form.type,
        salaryRange: form.salaryRange.trim() || undefined,
        status: form.status,
        openDate: form.openDate.trim(),
        closeDate: form.closeDate.trim() || undefined,
      };
      await updateJobPosting(selected.id, payload);
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
      <WorkshopFieldLabel>Title *</WorkshopFieldLabel>
      <WorkshopTextInput value={form.title} onChangeText={(v) => setForm((p) => ({ ...p, title: v }))} />
      <WorkshopFieldLabel>Description *</WorkshopFieldLabel>
      <WorkshopTextInput value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} multiline />
      <WorkshopFieldLabel>Location *</WorkshopFieldLabel>
      <WorkshopTextInput value={form.location} onChangeText={(v) => setForm((p) => ({ ...p, location: v }))} />
      <WorkshopFieldLabel>Salary range</WorkshopFieldLabel>
      <WorkshopTextInput value={form.salaryRange} onChangeText={(v) => setForm((p) => ({ ...p, salaryRange: v }))} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <WorkshopDatePickerField label="Open date *" value={form.openDate} onChange={(v) => setForm((p) => ({ ...p, openDate: v }))} />
        </View>
        <View style={{ flex: 1 }}>
          <WorkshopDatePickerField label="Close date" value={form.closeDate} onChange={(v) => setForm((p) => ({ ...p, closeDate: v }))} />
        </View>
      </View>
      <WorkshopChipSelect label="Department" options={[...DEPARTMENTS]} value={form.department} onChange={(v) => setForm((p) => ({ ...p, department: v as Department }))} />
      <WorkshopChipSelect label="Type" options={[...EMPLOYEE_TYPES]} value={form.type} onChange={(v) => setForm((p) => ({ ...p, type: v as EmployeeType }))} />
      <WorkshopChipSelect label="Status" options={[...JOB_STATUSES]} value={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v as JobStatus }))} />
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
      title="Job postings"
      subtitle="Open roles & recruitment"
      right={canManageHRM() ? <WorkshopHeaderButton onPress={openCreate} /> : undefined}
      scroll={false}
    >
      <WorkshopSearchBar value={q} onChangeText={setQ} placeholder="Search postings…" />

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
              icon="briefcase-outline"
              title="No job postings"
              subtitle="Create postings to attract candidates."
              actionLabel={canManageHRM() ? 'New posting' : undefined}
              onAction={canManageHRM() ? openCreate : undefined}
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="briefcase"
              iconColor="#2563eb"
              iconBg="#eff6ff"
              title={item.title}
              subtitle={item.location}
              meta={String(item.department)}
              badges={[
                { label: String(item.status), tone: 'status' },
                { label: String(item.type) },
              ]}
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
        title="Job posting"
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
            <Text style={{ fontSize: 22, fontWeight: '800', color: WS.text, marginBottom: 12 }}>{detail.title}</Text>
            <Text style={{ fontSize: 14, color: WS.textMuted, lineHeight: 20, marginBottom: 12 }}>{detail.description}</Text>
            <WorkshopDetailRow label="Type" value={String(detail.type)} />
            <WorkshopDetailRow label="Location" value={detail.location} />
            <WorkshopDetailRow label="Department" value={String(detail.department)} />
            <WorkshopDetailRow label="Status" value={String(detail.status)} />
            {detail.salaryRange ? (
              <WorkshopDetailRow label="Salary" value={detail.salaryRange} />
            ) : null}
          </>
        ) : null}
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={createOpen}
        title="New job posting"
        onClose={() => setCreateOpen(false)}
        footer={formFooter(() => void submitCreate(), 'Create posting', () => setCreateOpen(false))}
      >
        {renderForm()}
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={editOpen}
        title="Edit job posting"
        onClose={() => { setEditOpen(false); setSelected(null); }}
        footer={formFooter(() => void submitEdit(), 'Save posting', () => { setEditOpen(false); setSelected(null); })}
      >
        {renderForm()}
      </WorkshopFormSheet>
    </WorkshopChrome>
  );
}
