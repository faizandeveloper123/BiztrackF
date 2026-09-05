import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { getTrainingPrograms, createTrainingProgram, updateTrainingProgram, deleteTrainingProgram } from '../../../services/hrm/hrmMobileApi';
import type { Training, TrainingCreate, TrainingUpdate } from '../../../models/hrm';
import { TrainingStatus, TrainingType } from '../../../models/hrm';
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
  WorkshopPrimaryButton,
  WorkshopOutlineButton,
  WorkshopDetailRow,
  WS,
} from '../../workshop/components/WorkshopChrome';

const TRAINING_TYPES = Object.values(TrainingType);
const TRAINING_STATUSES = Object.values(TrainingStatus);

function todayIsoDate() {
  return new Date().toISOString().split('T')[0] || '';
}

function buildEmptyForm() {
  return {
    title: '',
    description: '',
    trainingType: TrainingType.SKILL_DEVELOPMENT,
    duration: '',
    cost: '',
    provider: '',
    startDate: todayIsoDate(),
    endDate: todayIsoDate(),
    maxParticipants: '',
    status: TrainingStatus.NOT_STARTED,
    objectives: '',
    prerequisites: '',
  };
}

export function MobileHrmTrainingScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageHRM } = usePermissions();
  const [rows, setRows] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<Training | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Training | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(buildEmptyForm());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTrainingPrograms(1, 100);
      setRows(res.training ?? []);
    } catch (e) {
      appError('HRM', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/hrm/training',
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

  const openCreate = () => {
    setForm(buildEmptyForm());
    setCreateOpen(true);
  };

  const openEdit = (training: Training) => {
    setSelected(training);
    setForm({
      title: training.title,
      description: training.description,
      trainingType: training.trainingType,
      duration: training.duration,
      cost: String(training.cost),
      provider: training.provider,
      startDate: training.startDate ? training.startDate.split('T')[0] || training.startDate : todayIsoDate(),
      endDate: training.endDate ? training.endDate.split('T')[0] || training.endDate : todayIsoDate(),
      maxParticipants: training.maxParticipants != null ? String(training.maxParticipants) : '',
      status: training.status,
      objectives: (training.objectives || []).join('\n'),
      prerequisites: (training.prerequisites || []).join('\n'),
    });
    setEditOpen(true);
  };

  const validateForm = () => {
    if (!form.title.trim() || !form.description.trim() || !form.provider.trim()) {
      appAlert('HRM', 'Title, description, and provider are required.');
      return false;
    }
    if (!form.startDate.trim() || !form.endDate.trim()) {
      appAlert('HRM', 'Start and end dates are required.');
      return false;
    }
    return true;
  };

  const buildPayload = (): TrainingCreate => {
    const cost = parseFloat(form.cost);
    const maxParticipants = parseInt(form.maxParticipants, 10);
    return {
      title: form.title.trim(),
      description: form.description.trim(),
      trainingType: form.trainingType,
      duration: form.duration.trim() || '',
      cost: Number.isFinite(cost) ? cost : 0,
      provider: form.provider.trim(),
      startDate: form.startDate.trim(),
      endDate: form.endDate.trim(),
      maxParticipants: Number.isFinite(maxParticipants) ? maxParticipants : undefined,
      status: form.status,
      objectives: form.objectives.split('\n').map((v) => v.trim()).filter(Boolean),
      prerequisites: form.prerequisites.split('\n').map((v) => v.trim()).filter(Boolean),
    };
  };

  const submitCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await createTrainingProgram(buildPayload());
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
      const updatePayload: TrainingUpdate = {
        title: payload.title,
        description: payload.description,
        trainingType: payload.trainingType,
        duration: payload.duration,
        cost: payload.cost,
        provider: payload.provider,
        startDate: payload.startDate,
        endDate: payload.endDate,
        maxParticipants: payload.maxParticipants,
        status: payload.status,
        objectives: payload.objectives,
        prerequisites: payload.prerequisites,
      };
      await updateTrainingProgram(selected.id, updatePayload);
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      appError('HRM', extractErrorMessage(e, 'Failed to update'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (training: Training) => {
    appConfirm({
      title: 'Delete training program',
      message: training.title,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteTrainingProgram(training.id);
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
      <WorkshopFieldLabel>Title *</WorkshopFieldLabel>
      <WorkshopTextInput value={form.title} onChangeText={(v) => setForm((p) => ({ ...p, title: v }))} />
      <WorkshopFieldLabel>Description *</WorkshopFieldLabel>
      <WorkshopTextInput value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} multiline />
      <WorkshopFieldLabel>Provider *</WorkshopFieldLabel>
      <WorkshopTextInput value={form.provider} onChangeText={(v) => setForm((p) => ({ ...p, provider: v }))} />
      <WorkshopFieldLabel>Duration</WorkshopFieldLabel>
      <WorkshopTextInput value={form.duration} onChangeText={(v) => setForm((p) => ({ ...p, duration: v }))} />
      <WorkshopFieldLabel>Cost</WorkshopFieldLabel>
      <WorkshopTextInput value={form.cost} onChangeText={(v) => setForm((p) => ({ ...p, cost: v }))} keyboardType="decimal-pad" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <WorkshopDatePickerField label="Start date *" value={form.startDate} onChange={(v) => setForm((p) => ({ ...p, startDate: v }))} />
        </View>
        <View style={{ flex: 1 }}>
          <WorkshopDatePickerField label="End date *" value={form.endDate} onChange={(v) => setForm((p) => ({ ...p, endDate: v }))} />
        </View>
      </View>
      <WorkshopFieldLabel>Max participants</WorkshopFieldLabel>
      <WorkshopTextInput value={form.maxParticipants} onChangeText={(v) => setForm((p) => ({ ...p, maxParticipants: v }))} keyboardType="number-pad" />
      <WorkshopChipSelect label="Type" options={[...TRAINING_TYPES]} value={form.trainingType} onChange={(v) => setForm((p) => ({ ...p, trainingType: v as TrainingType }))} />
      <WorkshopChipSelect label="Status" options={[...TRAINING_STATUSES]} value={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v as TrainingStatus }))} />
      <WorkshopFieldLabel>Objectives (one per line)</WorkshopFieldLabel>
      <WorkshopTextInput value={form.objectives} onChangeText={(v) => setForm((p) => ({ ...p, objectives: v }))} multiline />
      <WorkshopFieldLabel>Prerequisites (one per line)</WorkshopFieldLabel>
      <WorkshopTextInput value={form.prerequisites} onChangeText={(v) => setForm((p) => ({ ...p, prerequisites: v }))} multiline />
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
      title="Training"
      subtitle="Programs & development"
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
              icon="school-outline"
              title="No programs"
              subtitle="Create training programs for your team."
              actionLabel={canManageHRM() ? 'New program' : undefined}
              onAction={canManageHRM() ? openCreate : undefined}
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="school"
              iconColor="#059669"
              iconBg="#ecfdf5"
              title={item.title}
              subtitle={item.provider}
              meta={`${item.startDate} → ${item.endDate}`}
              badges={[
                { label: String(item.status), tone: 'status' },
                { label: String(item.trainingType) },
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
        title="Training"
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
            <WorkshopDetailRow label="Provider" value={detail.provider} />
            <WorkshopDetailRow label="Cost" value={formatUsd(detail.cost)} />
            <WorkshopDetailRow label="Duration" value={detail.duration || '—'} />
            <WorkshopDetailRow label="Type" value={String(detail.trainingType)} />
            <WorkshopDetailRow label="Status" value={String(detail.status)} />
            <WorkshopDetailRow label="Dates" value={`${detail.startDate} → ${detail.endDate}`} />
          </>
        ) : null}
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={createOpen}
        title="New training program"
        onClose={() => setCreateOpen(false)}
        footer={formFooter(() => void submitCreate(), 'Create program', () => setCreateOpen(false))}
      >
        {renderForm()}
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={editOpen}
        title="Edit training program"
        onClose={() => { setEditOpen(false); setSelected(null); }}
        footer={formFooter(() => void submitEdit(), 'Save program', () => { setEditOpen(false); setSelected(null); })}
      >
        {renderForm()}
      </WorkshopFormSheet>
    </WorkshopChrome>
  );
}
