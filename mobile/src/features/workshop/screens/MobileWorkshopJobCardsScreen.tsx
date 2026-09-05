import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import * as Sharing from 'expo-sharing';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import type { JobCard, JobCardCreate, JobCardUpdate } from '../../../models/workshop/JobCard';
import {
  getJobCards,
  createJobCard,
  updateJobCard,
  deleteJobCard,
  getTenantUsers,
  downloadJobCardPdfToShare,
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
  WorkshopDateTimePickerField,
  WorkshopPickerField,
  WorkshopPrimaryButton,
  WS,
} from '../components/WorkshopChrome';

const JC_STATUSES = ['draft', 'in_progress', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export function MobileWorkshopJobCardsScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [list, setList] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<JobCard | null>(null);
  const [userPick, setUserPick] = useState(false);
  const [users, setUsers] = useState<
    { id: string; name?: string; username?: string }[]
  >([]);
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'draft',
    priority: 'medium',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_vin: '',
    vehicle_color: '',
    vehicle_reg: '',
    vehicle_mileage: '',
    vehicle_engine_number: '',
    assigned_to_id: '',
    planned_date: '',
    date_time_out: '',
    labor_estimate: '0',
    parts_estimate: '0',
    vat_rate_percent: '15',
  });

  useEffect(() => {
    setSidebarActivePath('/workshop-management/job-cards');
  }, [setSidebarActivePath]);

  const loadRefs = useCallback(async () => {
    const u = await getTenantUsers();
    setUsers(u);
  }, []);

  const load = useCallback(async () => {
    const data = await getJobCards();
    setList(data);
  }, []);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await Promise.all([loadRefs(), load()]);
      } catch (e) {
        appError('Job cards', extractErrorMessage(e, 'Failed to load'));
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

  const filtered = list.filter((jc) => {
    const ok = statusF === 'all' || jc.status === statusF;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      jc.title.toLowerCase().includes(q) ||
      (jc.job_card_number || '').toLowerCase().includes(q) ||
      (jc.customer_name || '').toLowerCase().includes(q);
    return ok && matchSearch;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      status: 'draft',
      priority: 'medium',
      vehicle_make: '',
      vehicle_model: '',
      vehicle_year: '',
      vehicle_vin: '',
      vehicle_color: '',
      vehicle_reg: '',
      vehicle_mileage: '',
      vehicle_engine_number: '',
      assigned_to_id: '',
      planned_date: '',
      date_time_out: '',
      labor_estimate: '0',
      parts_estimate: '0',
      vat_rate_percent: '15',
    });
    setModalOpen(true);
  };

  const openEdit = (jc: JobCard) => {
    setEditing(jc);
    const vi = (jc.vehicle_info || {}) as Record<string, string>;
    const dateTimeOut = jc.completed_at
      ? jc.completed_at.slice(0, 16).replace('T', ' ')
      : '';
    setForm({
      title: jc.title || '',
      description: jc.description || '',
      status: jc.status || 'draft',
      priority: jc.priority || 'medium',
      vehicle_make: vi.make || '',
      vehicle_model: vi.model || '',
      vehicle_year: vi.year || '',
      vehicle_vin: vi.vin || '',
      vehicle_color: vi.color || '',
      vehicle_reg: vi.registration_number || '',
      vehicle_mileage: vi.mileage || '',
      vehicle_engine_number: (vi.engine_number as string) || '',
      assigned_to_id: jc.assigned_to_id || '',
      planned_date: jc.planned_date ? jc.planned_date.split('T')[0] : '',
      date_time_out: dateTimeOut,
      labor_estimate: String(jc.labor_estimate ?? 0),
      parts_estimate: String(jc.parts_estimate ?? 0),
      vat_rate_percent: String(
        jc.vat_rate != null ? Math.round(Number(jc.vat_rate) * 100) : 15,
      ),
    });
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.title.trim()) {
      appAlert('Job card', 'Title is required');
      return;
    }
    const vatPct = parseFloat(form.vat_rate_percent) || 0;
    const payload: JobCardCreate | JobCardUpdate = {
      title: form.title.trim(),
      description: form.description || undefined,
      status: form.status,
      priority: form.priority,
      vehicle_info: {
        make: form.vehicle_make || undefined,
        model: form.vehicle_model || undefined,
        year: form.vehicle_year || undefined,
        vin: form.vehicle_vin || undefined,
        color: form.vehicle_color || undefined,
        registration_number: form.vehicle_reg || undefined,
        mileage: form.vehicle_mileage || undefined,
        engine_number: form.vehicle_engine_number || undefined,
      },
      assigned_to_id: form.assigned_to_id || undefined,
      planned_date: form.planned_date
        ? `${form.planned_date}T12:00:00Z`
        : undefined,
      ...(form.date_time_out.trim()
        ? {
            completed_at: `${form.date_time_out.trim().replace(' ', 'T')}:00Z`,
          }
        : {}),
      labor_estimate: parseFloat(form.labor_estimate) || 0,
      parts_estimate: parseFloat(form.parts_estimate) || 0,
      vat_rate: vatPct / 100,
    };
    try {
      setSaving(true);
      if (editing) {
        await updateJobCard(editing.id, payload as JobCardUpdate);
      } else {
        await createJobCard(payload as JobCardCreate);
      }
      setModalOpen(false);
      await run(false);
    } catch (e) {
      appError('Job card', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (jc: JobCard) => {
    appConfirm({
      title: 'Delete',
      message: jc.title,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteJobCard(jc.id);
          await run(false);
        } catch (e) {
          appError('Job card', extractErrorMessage(e, 'Delete failed'));
        }
      },
    });
  };

  const sharePdf = async (jc: JobCard) => {
    try {
      setPdfBusy(jc.id);
      const { fileUri } = await downloadJobCardPdfToShare(jc.id);
      const can = await Sharing.isAvailableAsync();
      if (can) {
        await Sharing.shareAsync(fileUri);
      } else {
        appAlert('PDF', 'Sharing is not available on this device.');
      }
    } catch (e) {
      appError('PDF', extractErrorMessage(e, 'Could not export PDF'));
    } finally {
      setPdfBusy(null);
    }
  };

  const userItems = users.map((u) => ({
    id: u.id,
    label: u.name || u.username || u.id,
  }));

  const vehicleLabel = [form.vehicle_make, form.vehicle_model].filter(Boolean).join(' ');

  return (
    <WorkshopChrome
      title="Job cards"
      subtitle="Workshop job cards"
      right={<WorkshopHeaderButton onPress={openCreate} />}
      scroll={false}
    >
      <WorkshopFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search job cards…"
        resultCount={filtered.length}
        activeFilterCount={countActiveFilters([statusF])}
        onResetFilters={() => setStatusF('all')}
      >
        <WorkshopChipSelect
          label="Status"
          options={['all', ...JC_STATUSES]}
          value={statusF}
          onChange={setStatusF}
        />
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void run(true)}
              tintColor={WS.primary}
            />
          }
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="clipboard-outline"
              title="No job cards"
              subtitle="Create a job card to track vehicle work and estimates."
              actionLabel="Create job card"
              onAction={openCreate}
            />
          }
          renderItem={({ item: jc }) => {
            const vi = (jc.vehicle_info || {}) as Record<string, string>;
            const vehicle = [vi.make, vi.model].filter(Boolean).join(' ') || vi.registration_number;
            return (
              <WorkshopListCard
                kind="job-card"
                icon="clipboard"
                iconColor="#2563eb"
                iconBg="#eff6ff"
                kicker={jc.job_card_number}
                title={jc.title}
                subtitle={vehicle || 'No vehicle linked'}
                meta={jc.customer_name ? `Customer · ${jc.customer_name}` : undefined}
                badges={[
                  { label: jc.status, tone: 'status' },
                  { label: jc.priority, tone: 'priority' },
                ]}
                onPress={() => openEdit(jc)}
                actions={[
                  { icon: 'create-outline', onPress: () => openEdit(jc) },
                  {
                    icon: 'document-text-outline',
                    label: pdfBusy === jc.id ? '…' : 'PDF',
                    onPress: () => void sharePdf(jc),
                    loading: pdfBusy === jc.id,
                  },
                  { icon: 'trash-outline', onPress: () => remove(jc), danger: true },
                ]}
              />
            );
          }}
        />
      )}

      <PickerModal
        visible={userPick}
        title="Assign to"
        items={[{ id: '', label: 'None' }, ...userItems]}
        onSelect={(x) => setForm((f) => ({ ...f, assigned_to_id: x.id }))}
        onClose={() => setUserPick(false)}
      />

      <WorkshopFormSheet
        visible={modalOpen}
        title={editing ? 'Edit job card' : 'New job card'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <WorkshopPrimaryButton
              label={saving ? 'Saving…' : 'Save job card'}
              onPress={() => void submit()}
              disabled={saving}
            />
            <Pressable onPress={() => setModalOpen(false)} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        <WorkshopFieldLabel>Title *</WorkshopFieldLabel>
        <WorkshopTextInput value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} />
        <WorkshopFieldLabel>Description (Reported defect)</WorkshopFieldLabel>
        <WorkshopTextInput value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} multiline />
        <WorkshopPickerField
          label="Assign to"
          value={form.assigned_to_id ? userItems.find((x) => x.id === form.assigned_to_id)?.label ?? '' : ''}
          placeholder="Optional"
          onPress={() => setUserPick(true)}
        />
        <WorkshopChipSelect label="Status" options={[...JC_STATUSES]} value={form.status} onChange={(s) => setForm((f) => ({ ...f, status: s }))} />
        <WorkshopChipSelect label="Priority" options={[...PRIORITIES]} value={form.priority} onChange={(s) => setForm((f) => ({ ...f, priority: s }))} />
        <WorkshopFieldLabel>Vehicle</WorkshopFieldLabel>
        <WorkshopTextInput placeholder="Registration" value={form.vehicle_reg} onChangeText={(v) => setForm((f) => ({ ...f, vehicle_reg: v }))} />
        <WorkshopTextInput placeholder="VIN" value={form.vehicle_vin} onChangeText={(v) => setForm((f) => ({ ...f, vehicle_vin: v }))} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <WorkshopTextInput placeholder="Make" value={form.vehicle_make} onChangeText={(v) => setForm((f) => ({ ...f, vehicle_make: v }))} />
          </View>
          <View style={{ flex: 1 }}>
            <WorkshopTextInput placeholder="Model" value={form.vehicle_model} onChangeText={(v) => setForm((f) => ({ ...f, vehicle_model: v }))} />
          </View>
        </View>
        {vehicleLabel ? (
          <Text style={{ fontSize: 12, color: WS.textMuted, marginBottom: 8 }}>{vehicleLabel}</Text>
        ) : null}
        <WorkshopDatePickerField label="Planned date" value={form.planned_date} onChange={(v) => setForm((f) => ({ ...f, planned_date: v }))} />
        <WorkshopDateTimePickerField label="Completed at" value={form.date_time_out} onChange={(v) => setForm((f) => ({ ...f, date_time_out: v }))} />
        <WorkshopFieldLabel>Labor / Parts / VAT %</WorkshopFieldLabel>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><WorkshopTextInput keyboardType="decimal-pad" value={form.labor_estimate} onChangeText={(v) => setForm((f) => ({ ...f, labor_estimate: v }))} /></View>
          <View style={{ flex: 1 }}><WorkshopTextInput keyboardType="decimal-pad" value={form.parts_estimate} onChangeText={(v) => setForm((f) => ({ ...f, parts_estimate: v }))} /></View>
          <View style={{ width: 64 }}><WorkshopTextInput keyboardType="decimal-pad" value={form.vat_rate_percent} onChangeText={(v) => setForm((f) => ({ ...f, vat_rate_percent: v }))} /></View>
        </View>
      </WorkshopFormSheet>
    </WorkshopChrome>
  );
}
