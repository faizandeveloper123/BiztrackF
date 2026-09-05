import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import {
  InspectionType,
  QualityPriority,
  QualityStandard,
  QualityStatus,
  type QualityCheckCreate,
  type QualityCheckUpdate,
  type QualityCheckResponse,
} from '../../../models/qualityControl';
import {
  getQualityChecks,
  createQualityCheck,
  updateQualityCheck,
  deleteQualityCheck,
  getTenantUsers,
} from '../../../services/workshop/workshopMobileApi';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { PickerModal } from '../../healthcare/components/PickerModal';
import {
  WorkshopChrome,
  WorkshopChipSelect,
  WorkshopFilterBar,
  countActiveFilters,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopDatePickerField,
  WorkshopPickerField,
  WorkshopPrimaryButton,
  WS,
} from '../components/WorkshopChrome';

const INSP_TYPES = Object.values(InspectionType);
const Q_PRIOS = Object.values(QualityPriority);
const Q_STDS = Object.values(QualityStandard);
const Q_STATUSES = Object.values(QualityStatus);

export function MobileWorkshopQualityScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [list, setList] = useState<QualityCheckResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<QualityCheckResponse | null>(null);
  const [userPick, setUserPick] = useState(false);
  const [users, setUsers] = useState<
    { id: string; name?: string; username?: string }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    inspection_type: InspectionType.VISUAL,
    priority: QualityPriority.MEDIUM,
    quality_standard: QualityStandard.ISO_9001,
    criteriaText: '',
    estimated_duration_minutes: '30',
    scheduled_date: '',
    assigned_to_id: '',
  });

  useEffect(() => {
    setSidebarActivePath('/workshop-management/quality-control');
  }, [setSidebarActivePath]);

  const loadRefs = useCallback(async () => {
    const u = await getTenantUsers();
    setUsers(u);
  }, []);

  const load = useCallback(async () => {
    const { quality_checks } = await getQualityChecks({}, 1, 200);
    setList(quality_checks);
  }, []);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await Promise.all([loadRefs(), load()]);
      } catch (e) {
        appError('Quality', extractErrorMessage(e, 'Failed to load'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [load, loadRefs],
  );

  useEffect(() => {
    void run(false);
  }, [run]);

  const filtered = list.filter((q) => {
    const ok = statusF === 'all' || q.status === statusF;
    const s = search.toLowerCase();
    const match =
      !s ||
      q.title.toLowerCase().includes(s) ||
      (q.description || '').toLowerCase().includes(s);
    return ok && match;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      inspection_type: InspectionType.VISUAL,
      priority: QualityPriority.MEDIUM,
      quality_standard: QualityStandard.ISO_9001,
      criteriaText: '',
      estimated_duration_minutes: '30',
      scheduled_date: '',
      assigned_to_id: '',
    });
    setModalOpen(true);
  };

  const openEdit = (q: QualityCheckResponse) => {
    setEditing(q);
    setForm({
      title: q.title || '',
      description: q.description || '',
      inspection_type: q.inspection_type,
      priority: q.priority,
      quality_standard: q.quality_standard,
      criteriaText: (q.criteria || []).join(', '),
      estimated_duration_minutes: String(q.estimated_duration_minutes ?? 30),
      scheduled_date: q.scheduled_date ? q.scheduled_date.split('T')[0] : '',
      assigned_to_id: q.assigned_to_id || '',
    });
    setModalOpen(true);
  };

  const criteriaArr = () =>
    form.criteriaText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const submit = async () => {
    if (!form.title.trim()) {
      appAlert('Quality', 'Title is required');
      return;
    }
    try {
      setSaving(true);
      const scheduled = form.scheduled_date
        ? `${form.scheduled_date}T09:00:00Z`
        : undefined;
      if (editing) {
        const up: QualityCheckUpdate = {
          title: form.title.trim(),
          description: form.description || undefined,
          inspection_type: form.inspection_type,
          priority: form.priority,
          quality_standard: form.quality_standard,
          criteria: criteriaArr(),
          estimated_duration_minutes:
            parseInt(form.estimated_duration_minutes, 10) || 30,
          scheduled_date: scheduled,
          assigned_to_id: form.assigned_to_id || undefined,
        };
        await updateQualityCheck(editing.id, up);
      } else {
        const cr: QualityCheckCreate = {
          title: form.title.trim(),
          description: form.description || undefined,
          inspection_type: form.inspection_type,
          priority: form.priority,
          quality_standard: form.quality_standard,
          criteria: criteriaArr(),
          acceptance_criteria: {},
          tolerance_limits: {},
          required_equipment: [],
          required_skills: [],
          estimated_duration_minutes:
            parseInt(form.estimated_duration_minutes, 10) || 30,
          scheduled_date: scheduled,
          assigned_to_id: form.assigned_to_id || undefined,
          tags: [],
        };
        await createQualityCheck(cr);
      }
      setModalOpen(false);
      await run(false);
    } catch (e) {
      appError('Quality', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (q: QualityCheckResponse) => {
    appConfirm({
      title: 'Delete',
      message: q.title,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteQualityCheck(q.id);
          await run(false);
        } catch (e) {
          appError('Quality', extractErrorMessage(e, 'Delete failed'));
        }
      },
    });
  };

  const userItems = users.map((u) => ({
    id: u.id,
    label: u.name || u.username || u.id,
  }));

  return (
    <WorkshopChrome
      title="Quality control"
      subtitle="Inspections & checks"
      right={<WorkshopHeaderButton onPress={openCreate} />}
      scroll={false}
    >
      <WorkshopFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search inspections…"
        resultCount={filtered.length}
        activeFilterCount={countActiveFilters([statusF])}
        onResetFilters={() => setStatusF('all')}
      >
        <WorkshopChipSelect label="Status" options={['all', ...Q_STATUSES]} value={statusF} onChange={setStatusF} />
      </WorkshopFilterBar>

      {loading && !refreshing ? (
        <WorkshopLoading />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void run(true)} tintColor={WS.primary} />
          }
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="shield-checkmark-outline"
              title="No quality checks"
              subtitle="Schedule inspections and track compliance."
              actionLabel="Create check"
              onAction={openCreate}
            />
          }
          renderItem={({ item: q }) => (
            <WorkshopListCard
              kind="quality"
              icon="shield-checkmark"
              iconColor="#059669"
              iconBg="#ecfdf5"
              kicker={q.scheduled_date ? q.scheduled_date.split('T')[0] : 'Unscheduled'}
              title={q.title}
              subtitle={String(q.inspection_type).replace(/_/g, ' ')}
              meta={String(q.quality_standard).replace(/_/g, ' ')}
              badges={[
                { label: String(q.status), tone: 'status' },
                { label: String(q.priority), tone: 'priority' },
              ]}
              progress={q.completion_percentage ?? 0}
              onPress={() => openEdit(q)}
              actions={[
                { icon: 'create-outline', onPress: () => openEdit(q) },
                { icon: 'trash-outline', onPress: () => remove(q), danger: true },
              ]}
            />
          )}
        />
      )}

      <PickerModal visible={userPick} title="Assign to" items={[{ id: '', label: 'None' }, ...userItems]} onSelect={(x) => setForm((f) => ({ ...f, assigned_to_id: x.id }))} onClose={() => setUserPick(false)} />

      <WorkshopFormSheet
        visible={modalOpen}
        title={editing ? 'Edit check' : 'New check'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <WorkshopPrimaryButton label={saving ? 'Saving…' : 'Save check'} onPress={() => void submit()} disabled={saving} />
            <Pressable onPress={() => setModalOpen(false)} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        <WorkshopFieldLabel>Title *</WorkshopFieldLabel>
        <WorkshopTextInput value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} />
        <WorkshopFieldLabel>Description</WorkshopFieldLabel>
        <WorkshopTextInput value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} multiline />
        <WorkshopChipSelect label="Inspection type" options={[...INSP_TYPES]} value={form.inspection_type} onChange={(s) => setForm((f) => ({ ...f, inspection_type: s as InspectionType }))} />
        <WorkshopChipSelect label="Priority" options={[...Q_PRIOS]} value={form.priority} onChange={(s) => setForm((f) => ({ ...f, priority: s as QualityPriority }))} />
        <WorkshopChipSelect label="Standard" options={[...Q_STDS]} value={form.quality_standard} onChange={(s) => setForm((f) => ({ ...f, quality_standard: s as QualityStandard }))} />
        <WorkshopFieldLabel>Criteria (comma-separated)</WorkshopFieldLabel>
        <WorkshopTextInput value={form.criteriaText} onChangeText={(v) => setForm((f) => ({ ...f, criteriaText: v }))} />
        <WorkshopFieldLabel>Duration (minutes)</WorkshopFieldLabel>
        <WorkshopTextInput keyboardType="number-pad" value={form.estimated_duration_minutes} onChangeText={(v) => setForm((f) => ({ ...f, estimated_duration_minutes: v }))} />
        <WorkshopDatePickerField label="Scheduled date" value={form.scheduled_date} onChange={(v) => setForm((f) => ({ ...f, scheduled_date: v }))} />
        <WorkshopPickerField label="Assign to" value={form.assigned_to_id ? userItems.find((x) => x.id === form.assigned_to_id)?.label ?? '' : ''} placeholder="Optional" onPress={() => setUserPick(true)} />
      </WorkshopFormSheet>
    </WorkshopChrome>
  );
}
