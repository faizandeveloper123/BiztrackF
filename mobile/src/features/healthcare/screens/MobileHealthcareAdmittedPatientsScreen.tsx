import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import type {
  Admission,
  AdmissionCreate,
  Doctor,
  Patient,
} from '../../../models/healthcare';
import { ADMISSION_STATUSES } from '../../../models/healthcare';
import {
  getAdmissions,
  getDoctors,
  getPatients,
  createAdmission,
  updateAdmission,
  deleteAdmission,
  createAdmissionInvoice,
} from '../../../services/healthcare/healthcareMobileApi';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  HealthcareChrome,
  HealthcareCard,
  HealthcareFieldLabel,
  HealthcarePrimaryButton,
  HealthcareOutlineButton,
} from '../components/HealthcareChrome';
import { WorkshopDatePickerField } from '../../workshop/components/WorkshopChrome';
import { PickerModal } from '../components/PickerModal';
import { AppModal } from '../../../components/layout/AppModal';
import { KeyboardBottomSheetShell } from '../../../components/layout/KeyboardBottomSheetShell';

const PAGE_SIZE = 20;

export function MobileHealthcareAdmittedPatientsScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [list, setList] = useState<Admission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [statusFilter, setStatusFilter] = useState('__all__');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('__all__');
  const [patientFilter, setPatientFilter] = useState('__all__');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Admission | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<AdmissionCreate>({
    patient_id: '',
    doctor_id: '',
    admit_date: new Date().toISOString().slice(0, 10),
    ward: '',
    room_or_bed: '',
    diagnosis: '',
    notes: '',
    status: 'admitted',
  });
  const [statusPick, setStatusPick] = useState(false);
  const [filterDocPick, setFilterDocPick] = useState(false);
  const [filterPatPick, setFilterPatPick] = useState(false);
  const [formDocPick, setFormDocPick] = useState(false);
  const [formPatPick, setFormPatPick] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [billAdm, setBillAdm] = useState<Admission | null>(null);
  const [billLines, setBillLines] = useState<
    { description: string; amount: number }[]
  >([{ description: '', amount: 0 }]);
  const [billBusy, setBillBusy] = useState(false);

  useEffect(() => {
    setSidebarActivePath('/healthcare/admitted-patients');
  }, [setSidebarActivePath]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced, statusFilter, dateFrom, dateTo, doctorFilter, patientFilter]);

  useEffect(() => {
    void (async () => {
      try {
        const [dr, pt] = await Promise.all([
          getDoctors({ limit: 500 }),
          getPatients({ limit: 500 }),
        ]);
        setDoctors(dr.doctors);
        setPatients(pt.patients);
      } catch {
        // ignore
      }
    })();
  }, []);

  const load = useCallback(async () => {
    const res = await getAdmissions({
      search: debounced.trim() || undefined,
      page,
      limit: PAGE_SIZE,
      status: statusFilter !== '__all__' ? statusFilter : undefined,
      date_from: dateFrom.trim() || undefined,
      date_to: dateTo.trim() || undefined,
      doctor_id: doctorFilter !== '__all__' ? doctorFilter : undefined,
      patient_id: patientFilter !== '__all__' ? patientFilter : undefined,
    });
    setList(res.admissions);
    setTotal(res.total);
  }, [
    debounced,
    page,
    statusFilter,
    dateFrom,
    dateTo,
    doctorFilter,
    patientFilter,
  ]);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch (e) {
        Alert.alert('Admissions', extractErrorMessage(e, 'Failed to load'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [load],
  );

  useEffect(() => {
    void run(false);
  }, [run]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openAdd = () => {
    setEditing(null);
    setForm({
      patient_id: patients[0]?.id ?? '',
      doctor_id: doctors[0]?.id ?? '',
      admit_date: new Date().toISOString().slice(0, 10),
      ward: '',
      room_or_bed: '',
      diagnosis: '',
      notes: '',
      status: 'admitted',
    });
    setFormOpen(true);
  };

  const openEdit = (a: Admission) => {
    setEditing(a);
    setForm({
      patient_id: a.patient_id,
      doctor_id: a.doctor_id,
      admit_date: a.admit_date,
      discharge_date: a.discharge_date ?? '',
      ward: a.ward,
      room_or_bed: a.room_or_bed ?? '',
      diagnosis: a.diagnosis ?? '',
      notes: a.notes ?? '',
      status: a.status,
    });
    setFormOpen(true);
  };

  const submit = async () => {
    if (
      !form.patient_id ||
      !form.doctor_id ||
      !form.admit_date ||
      !form.ward.trim()
    ) {
      Alert.alert('Admissions', 'Patient, doctor, date and ward are required');
      return;
    }
    try {
      setSubmitting(true);
      const payload: AdmissionCreate = {
        patient_id: form.patient_id,
        doctor_id: form.doctor_id,
        admit_date: form.admit_date,
        discharge_date: form.discharge_date?.trim() || undefined,
        ward: form.ward.trim(),
        room_or_bed: form.room_or_bed?.trim() || undefined,
        diagnosis: form.diagnosis?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        status: form.status,
      };
      if (editing) {
        await updateAdmission(editing.id, {
          ...payload,
          discharge_date: payload.discharge_date,
          status: payload.status,
        });
      } else {
        await createAdmission(payload);
      }
      setFormOpen(false);
      await run(false);
    } catch (e) {
      Alert.alert('Admissions', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = (a: Admission) => {
    Alert.alert('Delete admission', 'Remove this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdmission(a.id);
            await run(false);
          } catch (e) {
            Alert.alert(
              'Admissions',
              extractErrorMessage(e, 'Delete failed'),
            );
          }
        },
      },
    ]);
  };

  const submitBill = async () => {
    if (!billAdm) return;
    const lines = billLines.filter(
      (l) => l.description.trim() && l.amount > 0,
    );
    if (!lines.length) {
      Alert.alert('Invoice', 'Add line items');
      return;
    }
    try {
      setBillBusy(true);
      await createAdmissionInvoice(billAdm.id, {
        line_items: lines.map((l) => ({
          description: l.description.trim(),
          amount: l.amount,
        })),
      });
      setBillOpen(false);
      Alert.alert('Invoice', 'Created');
    } catch (e) {
      Alert.alert('Invoice', extractErrorMessage(e, 'Failed'));
    } finally {
      setBillBusy(false);
    }
  };

  const doctorItems = doctors.map((d) => ({
    id: d.id,
    label: `${d.first_name} ${d.last_name}`.trim(),
  }));
  const patientItems = patients.map((p) => ({
    id: p.id,
    label: p.full_name,
  }));

  return (
    <HealthcareChrome
      title="Admissions"
      subtitle="Hospital admitted patients"
      right={
        <Pressable onPress={openAdd} className="p-2">
          <Ionicons name="add-circle" size={26} color="#0d9488" />
        </Pressable>
      }
      scroll={false}
    >
      <TextInput
        className="mb-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
        placeholder="Search…"
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#94a3b8"
      />
      <View className="mb-2 flex-row gap-2">
        <View style={{ flex: 1 }}>
          <WorkshopDatePickerField label="From" value={dateFrom} onChange={setDateFrom} />
        </View>
        <View style={{ flex: 1 }}>
          <WorkshopDatePickerField label="To" value={dateTo} onChange={setDateTo} />
        </View>
      </View>
      <View className="mb-2 flex-row flex-wrap gap-2">
        <Pressable
          onPress={() => setStatusPick(true)}
          className="rounded-lg bg-white px-3 py-1.5"
        >
          <Text className="text-xs text-slate-800">
            Status: {statusFilter === '__all__' ? 'All' : statusFilter}
          </Text>
        </Pressable>
        <Pressable onPress={() => setFilterDocPick(true)} className="rounded-lg bg-white px-3 py-1.5">
          <Text className="text-xs text-slate-800">Doctor</Text>
        </Pressable>
        <Pressable onPress={() => setFilterPatPick(true)} className="rounded-lg bg-white px-3 py-1.5">
          <Text className="text-xs text-slate-800">Patient</Text>
        </Pressable>
      </View>

      {loading && !refreshing ? (
        <View className="py-12 items-center">
          <ActivityIndicator color="#0d9488" />
        </View>
      ) : (
        <FlatList
          className="flex-1"
          data={list}
          keyExtractor={(x) => x.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void run(true)}
              tintColor="#0d9488"
            />
          }
          renderItem={({ item: a }) => (
            <HealthcareCard>
              <Text className="font-semibold text-slate-900">
                {a.patient_name ?? 'Patient'}
              </Text>
              <Text className="text-sm text-slate-600">
                Ward {a.ward} · {a.admit_date}
              </Text>
              <Text className="text-xs capitalize text-slate-500">
                {a.status}
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => openEdit(a)}
                  className="rounded-lg bg-slate-100 px-2 py-1"
                >
                  <Text className="text-xs font-medium">Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setBillAdm(a);
                    setBillLines([{ description: '', amount: 0 }]);
                    setBillOpen(true);
                  }}
                  className="rounded-lg bg-amber-100 px-2 py-1"
                >
                  <Text className="text-xs font-medium text-amber-900">
                    Bill
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => remove(a)}
                  className="rounded-lg bg-red-50 px-2 py-1"
                >
                  <Text className="text-xs text-red-700">Delete</Text>
                </Pressable>
              </View>
            </HealthcareCard>
          )}
        />
      )}

      <View className="flex-row items-center justify-between py-4">
        <HealthcareOutlineButton
          label="Prev"
          onPress={() => setPage((p) => Math.max(1, p - 1))}
        />
        <Text className="text-sm text-slate-600">
          Page {page} / {totalPages}
        </Text>
        <HealthcareOutlineButton
          label="Next"
          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      </View>

      <PickerModal
        visible={statusPick}
        title="Status"
        items={[
          { id: '__all__', label: 'All' },
          ...ADMISSION_STATUSES.map((s) => ({ id: s, label: s })),
        ]}
        onSelect={(x) => setStatusFilter(x.id)}
        onClose={() => setStatusPick(false)}
      />
      <PickerModal
        visible={filterDocPick}
        title="Doctor filter"
        items={[{ id: '__all__', label: 'All' }, ...doctorItems]}
        onSelect={(x) => setDoctorFilter(x.id)}
        onClose={() => setFilterDocPick(false)}
      />
      <PickerModal
        visible={filterPatPick}
        title="Patient filter"
        items={[{ id: '__all__', label: 'All' }, ...patientItems]}
        onSelect={(x) => setPatientFilter(x.id)}
        onClose={() => setFilterPatPick(false)}
      />
      <PickerModal
        visible={formDocPick}
        title="Doctor"
        items={doctorItems}
        onSelect={(x) => setForm((f) => ({ ...f, doctor_id: x.id }))}
        onClose={() => setFormDocPick(false)}
      />
      <PickerModal
        visible={formPatPick}
        title="Patient"
        items={patientItems}
        onSelect={(x) => setForm((f) => ({ ...f, patient_id: x.id }))}
        onClose={() => setFormPatPick(false)}
      />

      <AppModal
        visible={formOpen}
        animationType="slide"
        transparent
        onClose={() => setFormOpen(false)}
      >
        <KeyboardBottomSheetShell overlayColor="rgba(0,0,0,0.4)">
          <View className="max-h-[90%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="mb-3 text-lg font-semibold">
              {editing ? 'Edit admission' : 'New admission'}
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <HealthcareFieldLabel>Patient *</HealthcareFieldLabel>
              <Pressable
                onPress={() => setFormPatPick(true)}
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2"
              >
                <Text>
                  {patients.find((p) => p.id === form.patient_id)?.full_name ??
                    'Select'}
                </Text>
              </Pressable>
              <HealthcareFieldLabel>Doctor *</HealthcareFieldLabel>
              <Pressable
                onPress={() => setFormDocPick(true)}
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2"
              >
                <Text>
                  {(() => {
                    const d = doctors.find((x) => x.id === form.doctor_id);
                    return d
                      ? `${d.first_name} ${d.last_name}`
                      : 'Select';
                  })()}
                </Text>
              </Pressable>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <WorkshopDatePickerField
                    label="Admit date *"
                    value={form.admit_date}
                    onChange={(v) => setForm((f) => ({ ...f, admit_date: v }))}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <WorkshopDatePickerField
                    label="Discharge date"
                    value={form.discharge_date ?? ''}
                    onChange={(v) => setForm((f) => ({ ...f, discharge_date: v }))}
                  />
                </View>
              </View>
              <HealthcareFieldLabel>Ward *</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2"
                value={form.ward}
                onChangeText={(v) => setForm((f) => ({ ...f, ward: v }))}
              />
              <HealthcareFieldLabel>Room / bed</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2"
                value={form.room_or_bed ?? ''}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, room_or_bed: v }))
                }
              />
              <HealthcareFieldLabel>Diagnosis</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2"
                value={form.diagnosis ?? ''}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, diagnosis: v }))
                }
                multiline
              />
              <HealthcareFieldLabel>Notes</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2"
                value={form.notes ?? ''}
                onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
                multiline
              />
              <HealthcareFieldLabel>Status</HealthcareFieldLabel>
              <View className="mb-4 flex-row flex-wrap gap-2">
                {ADMISSION_STATUSES.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setForm((f) => ({ ...f, status: s }))}
                    className={`rounded-full px-3 py-1 ${form.status === s ? 'bg-teal-600' : 'bg-slate-100'}`}
                  >
                    <Text
                      className={`text-xs capitalize ${form.status === s ? 'text-white' : 'text-slate-700'}`}
                    >
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <HealthcarePrimaryButton
              label={submitting ? 'Saving…' : 'Save'}
              onPress={() => void submit()}
              disabled={submitting}
            />
            <Pressable className="mt-2 items-center py-2" onPress={() => setFormOpen(false)}>
              <Text className="text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </KeyboardBottomSheetShell>
      </AppModal>

      <AppModal
        visible={billOpen}
        animationType="slide"
        transparent
        onClose={() => setBillOpen(false)}
      >
        <KeyboardBottomSheetShell overlayColor="rgba(0,0,0,0.4)">
          <View className="max-h-[75%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="mb-2 font-semibold">Admission invoice</Text>
            <ScrollView>
              {billLines.map((line, i) => (
                <View key={i} className="mb-2 flex-row gap-2">
                  <TextInput
                    className="flex-1 rounded-lg border border-slate-200 px-2 py-1"
                    placeholder="Description"
                    value={line.description}
                    onChangeText={(v) => {
                      const n = [...billLines];
                      n[i] = { ...n[i], description: v };
                      setBillLines(n);
                    }}
                  />
                  <TextInput
                    className="w-20 rounded-lg border border-slate-200 px-2 py-1"
                    keyboardType="decimal-pad"
                    value={line.amount ? String(line.amount) : ''}
                    onChangeText={(v) => {
                      const n = [...billLines];
                      n[i] = { ...n[i], amount: parseFloat(v) || 0 };
                      setBillLines(n);
                    }}
                  />
                </View>
              ))}
              <Pressable
                onPress={() =>
                  setBillLines((l) => [...l, { description: '', amount: 0 }])
                }
              >
                <Text className="mb-3 text-teal-700">+ Line</Text>
              </Pressable>
            </ScrollView>
            <HealthcarePrimaryButton
              label={billBusy ? '…' : 'Create'}
              onPress={() => void submitBill()}
              disabled={billBusy}
            />
            <Pressable className="mt-2 items-center" onPress={() => setBillOpen(false)}>
              <Text className="text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </KeyboardBottomSheetShell>
      </AppModal>
    </HealthcareChrome>
  );
}
