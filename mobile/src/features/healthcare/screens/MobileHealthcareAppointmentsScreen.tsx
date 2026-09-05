import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { formatYMD } from '../../../utils/dateMobile';
import { Ionicons } from '@expo/vector-icons';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import type {
  Appointment,
  AppointmentCreate,
  Doctor,
  Patient,
  Prescription,
  PrescriptionCreate,
  PrescriptionItem,
} from '../../../models/healthcare';
import { APPOINTMENT_STATUSES } from '../../../models/healthcare';
import {
  getAppointments,
  getDoctors,
  getPatients,
  getPatient,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getPrescriptions,
  createPrescription,
  deletePrescription,
  createAppointmentInvoice,
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

function doctorLabel(d: Doctor) {
  return `${d.first_name} ${d.last_name}`.trim();
}

export function MobileHealthcareAppointmentsScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [list, setList] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('__all__');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterDoctorPicker, setFilterDoctorPicker] = useState(false);
  const [formDoctorPicker, setFormDoctorPicker] = useState(false);
  const [patientPicker, setPatientPicker] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientHits, setPatientHits] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState<
    AppointmentCreate & { patient_id?: string }
  >({
    doctor_id: '',
    patient_id: '',
    patient_name: '',
    patient_phone: '',
    appointment_date: formatYMD(new Date()),
    start_time: '09:00',
    end_time: '09:30',
    status: 'scheduled',
    notes: '',
  });

  const [rxOpen, setRxOpen] = useState(false);
  const [rxApt, setRxApt] = useState<Appointment | null>(null);
  const [rxItems, setRxItems] = useState<PrescriptionItem[]>([
    { type: 'medicine', medicine_name: '', dosage: '', frequency: '', duration: '' },
  ]);
  const [rxNotes, setRxNotes] = useState('');
  const [rxBusy, setRxBusy] = useState(false);

  const [viewRxOpen, setViewRxOpen] = useState(false);
  const [viewRxApt, setViewRxApt] = useState<Appointment | null>(null);
  const [viewRxList, setViewRxList] = useState<Prescription[]>([]);

  const [invOpen, setInvOpen] = useState(false);
  const [invApt, setInvApt] = useState<Appointment | null>(null);
  const [invLines, setInvLines] = useState<
    { description: string; amount: number }[]
  >([{ description: '', amount: 0 }]);
  const [invBusy, setInvBusy] = useState(false);

  useEffect(() => {
    setSidebarActivePath('/healthcare/appointments');
  }, [setSidebarActivePath]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced, dateFrom, dateTo, doctorFilter]);

  const loadDoctors = useCallback(async () => {
    const res = await getDoctors({ limit: 500 });
    setDoctors(res.doctors);
  }, []);

  useEffect(() => {
    void loadDoctors();
  }, [loadDoctors]);

  const loadPatientsForPicker = useCallback(async () => {
    const res = await getPatients({
      search: patientSearch.trim() || undefined,
      limit: 50,
    });
    setPatientHits(res.patients);
  }, [patientSearch]);

  useEffect(() => {
    if (!patientPicker) return;
    const t = setTimeout(() => void loadPatientsForPicker(), 300);
    return () => clearTimeout(t);
  }, [patientPicker, patientSearch, loadPatientsForPicker]);

  const load = useCallback(async () => {
    const res = await getAppointments({
      search: debounced.trim() || undefined,
      page,
      limit: PAGE_SIZE,
      date_from: dateFrom.trim() || undefined,
      date_to: dateTo.trim() || undefined,
      doctor_id:
        doctorFilter !== '__all__' ? doctorFilter : undefined,
    });
    setList(res.appointments);
    setTotal(res.total);
  }, [debounced, page, dateFrom, dateTo, doctorFilter]);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch (e) {
        Alert.alert(
          'Appointments',
          extractErrorMessage(e, 'Failed to load'),
        );
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
    setSelectedPatient(null);
    setForm({
      doctor_id: doctors[0]?.id ?? '',
      patient_id: '',
      patient_name: '',
      patient_phone: '',
      appointment_date: formatYMD(new Date()),
      start_time: '09:00',
      end_time: '09:30',
      status: 'scheduled',
      notes: '',
    });
    setFormOpen(true);
  };

  const openEdit = async (a: Appointment) => {
    setEditing(a);
    setForm({
      doctor_id: a.doctor_id,
      patient_id: a.patient_id ?? '',
      patient_name: a.patient_name,
      patient_phone: a.patient_phone ?? '',
      appointment_date: a.appointment_date,
      start_time: a.start_time,
      end_time: a.end_time,
      status: a.status,
      notes: a.notes ?? '',
    });
    if (a.patient_id) {
      try {
        const p = await getPatient(a.patient_id);
        setSelectedPatient(p);
      } catch {
        setSelectedPatient(null);
      }
    } else setSelectedPatient(null);
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.doctor_id || !form.appointment_date) {
      Alert.alert('Appointments', 'Doctor and date are required');
      return;
    }
    if (!form.patient_name?.trim()) {
      Alert.alert('Appointments', 'Patient name is required');
      return;
    }
    try {
      setSubmitting(true);
      const payload: AppointmentCreate = {
        doctor_id: form.doctor_id,
        patient_id: form.patient_id?.trim() || undefined,
        patient_name: form.patient_name.trim(),
        patient_phone: form.patient_phone?.trim() || undefined,
        appointment_date: form.appointment_date,
        start_time: form.start_time,
        end_time: form.end_time,
        status: form.status,
        notes: form.notes?.trim() || undefined,
      };
      if (editing) {
        await updateAppointment(editing.id, payload);
      } else {
        await createAppointment(payload);
      }
      setFormOpen(false);
      await run(false);
    } catch (e) {
      Alert.alert('Appointments', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = (a: Appointment) => {
    Alert.alert('Delete appointment', 'Remove this appointment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAppointment(a.id);
            await run(false);
          } catch (e) {
            Alert.alert(
              'Appointments',
              extractErrorMessage(e, 'Delete failed'),
            );
          }
        },
      },
    ]);
  };

  const markComplete = async (a: Appointment) => {
    try {
      await updateAppointment(a.id, { status: 'completed' });
      await run(false);
    } catch (e) {
      Alert.alert('Appointments', extractErrorMessage(e, 'Update failed'));
    }
  };

  const openRx = (a: Appointment) => {
    setRxApt(a);
    setRxNotes('');
    setRxItems([
      { type: 'medicine', medicine_name: '', dosage: '', frequency: '', duration: '' },
    ]);
    setRxOpen(true);
  };

  const submitRx = async () => {
    if (!rxApt) return;
    const items = rxItems.filter((i) => (i.medicine_name || '').trim());
    if (!items.length) {
      Alert.alert('Prescription', 'Add at least one medicine line');
      return;
    }
    try {
      setRxBusy(true);
      const body: PrescriptionCreate = {
        appointment_id: rxApt.id,
        doctor_id: rxApt.doctor_id,
        patient_name: rxApt.patient_name,
        patient_phone: rxApt.patient_phone,
        prescription_date: formatYMD(new Date()),
        notes: rxNotes.trim() || undefined,
        items: items.map((i) => ({
          type: 'medicine' as const,
          medicine_name: i.medicine_name?.trim(),
          dosage: i.dosage?.trim(),
          frequency: i.frequency?.trim(),
          duration: i.duration?.trim(),
        })),
      };
      await createPrescription(body);
      setRxOpen(false);
      Alert.alert('Prescription', 'Saved');
    } catch (e) {
      Alert.alert('Prescription', extractErrorMessage(e, 'Save failed'));
    } finally {
      setRxBusy(false);
    }
  };

  const openViewRx = async (a: Appointment) => {
    setViewRxApt(a);
    try {
      const res = await getPrescriptions({
        appointment_id: a.id,
        limit: 100,
      });
      setViewRxList(res.prescriptions);
      setViewRxOpen(true);
    } catch (e) {
      Alert.alert('Prescriptions', extractErrorMessage(e, 'Load failed'));
    }
  };

  const openInv = (a: Appointment) => {
    setInvApt(a);
    setInvLines([{ description: '', amount: 0 }]);
    setInvOpen(true);
  };

  const submitInv = async () => {
    if (!invApt) return;
    const lines = invLines.filter(
      (l) => l.description.trim() && l.amount > 0,
    );
    if (!lines.length) {
      Alert.alert('Invoice', 'Add at least one line with amount greater than 0');
      return;
    }
    try {
      setInvBusy(true);
      await createAppointmentInvoice(invApt.id, {
        line_items: lines.map((l) => ({
          description: l.description.trim(),
          amount: l.amount,
        })),
      });
      setInvOpen(false);
      Alert.alert('Invoice', 'Created');
    } catch (e) {
      Alert.alert('Invoice', extractErrorMessage(e, 'Failed'));
    } finally {
      setInvBusy(false);
    }
  };

  const doctorItems = doctors.map((d) => ({
    id: d.id,
    label: doctorLabel(d),
  }));

  return (
    <HealthcareChrome
      title="Appointments"
      subtitle="Schedule and clinical actions"
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
        placeholderTextColor="#94a3b8"
        value={search}
        onChangeText={setSearch}
      />
      <View className="mb-2 flex-row gap-2">
        <View style={{ flex: 1 }}>
          <WorkshopDatePickerField label="From" value={dateFrom} onChange={setDateFrom} />
        </View>
        <View style={{ flex: 1 }}>
          <WorkshopDatePickerField label="To" value={dateTo} onChange={setDateTo} />
        </View>
      </View>
      <Pressable
        onPress={() => setFilterDoctorPicker(true)}
        className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
      >
        <Text className="text-sm text-slate-800">
          Doctor:{' '}
          {doctorFilter === '__all__'
            ? 'All'
            : (() => {
                const d = doctors.find((x) => x.id === doctorFilter);
                return d ? doctorLabel(d) : '—';
              })()}
        </Text>
      </Pressable>

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
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">
              No appointments.
            </Text>
          }
          renderItem={({ item }) => (
            <HealthcareCard>
              <Text className="font-semibold text-slate-900">
                {item.appointment_date} {item.start_time}
              </Text>
              <Text className="text-slate-700">{item.patient_name}</Text>
              <Text className="text-xs capitalize text-slate-500">
                {item.status?.replace('_', ' ')}
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => void openEdit(item)}
                  className="rounded-lg bg-slate-100 px-2 py-1"
                >
                  <Text className="text-xs font-medium text-slate-800">Edit</Text>
                </Pressable>
                {item.status !== 'completed' ? (
                  <Pressable
                    onPress={() => void markComplete(item)}
                    className="rounded-lg bg-teal-100 px-2 py-1"
                  >
                    <Text className="text-xs font-medium text-teal-900">
                      Complete
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => openRx(item)}
                  className="rounded-lg bg-indigo-100 px-2 py-1"
                >
                  <Text className="text-xs font-medium text-indigo-900">
                    Rx
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void openViewRx(item)}
                  className="rounded-lg bg-slate-100 px-2 py-1"
                >
                  <Text className="text-xs font-medium text-slate-800">
                    View Rx
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => openInv(item)}
                  className="rounded-lg bg-amber-100 px-2 py-1"
                >
                  <Text className="text-xs font-medium text-amber-900">
                    Invoice
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => remove(item)}
                  className="rounded-lg bg-red-50 px-2 py-1"
                >
                  <Text className="text-xs font-medium text-red-700">
                    Delete
                  </Text>
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
        visible={filterDoctorPicker}
        title="Filter by doctor"
        items={[{ id: '__all__', label: 'All doctors' }, ...doctorItems]}
        onSelect={(x) => setDoctorFilter(x.id)}
        onClose={() => setFilterDoctorPicker(false)}
      />
      <PickerModal
        visible={formDoctorPicker}
        title="Doctor"
        items={doctorItems}
        onSelect={(x) =>
          setForm((f) => ({ ...f, doctor_id: x.id }))
        }
        onClose={() => setFormDoctorPicker(false)}
      />

      <AppModal
        visible={patientPicker}
        animationType="slide"
        transparent
        onClose={() => setPatientPicker(false)}
      >
        <KeyboardBottomSheetShell overlayColor="rgba(0,0,0,0.4)">
          <View className="max-h-[70%] rounded-t-2xl bg-white px-4 pb-6 pt-4">
            <Text className="mb-2 font-semibold text-slate-900">
              Select patient
            </Text>
            <TextInput
              className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              placeholder="Search patients…"
              value={patientSearch}
              onChangeText={setPatientSearch}
            />
            <FlatList
              data={patientHits}
              keyExtractor={(x) => x.id}
              renderItem={({ item: p }) => (
                <Pressable
                  className="border-b border-slate-100 py-3"
                  onPress={() => {
                    setSelectedPatient(p);
                    setForm((f) => ({
                      ...f,
                      patient_id: p.id,
                      patient_name: p.full_name,
                      patient_phone: p.phone ?? '',
                    }));
                    setPatientPicker(false);
                  }}
                >
                  <Text className="text-slate-900">{p.full_name}</Text>
                  <Text className="text-xs text-slate-500">{p.phone}</Text>
                </Pressable>
              )}
            />
            <Pressable
              className="mt-3 items-center py-2"
              onPress={() => setPatientPicker(false)}
            >
              <Text className="text-slate-600">Close</Text>
            </Pressable>
          </View>
        </KeyboardBottomSheetShell>
      </AppModal>

      <AppModal
        visible={formOpen}
        animationType="slide"
        transparent
        onClose={() => setFormOpen(false)}
      >
        <KeyboardBottomSheetShell overlayColor="rgba(0,0,0,0.4)">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="mb-4 text-lg font-semibold text-slate-900">
              {editing ? 'Edit appointment' : 'New appointment'}
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <HealthcareFieldLabel>Doctor *</HealthcareFieldLabel>
              <Pressable
                onPress={() => setFormDoctorPicker(true)}
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2"
              >
                <Text className="text-slate-800">
                  {(() => {
                    const d = doctors.find((x) => x.id === form.doctor_id);
                    return d ? doctorLabel(d) : 'Choose doctor';
                  })()}
                </Text>
              </Pressable>
              <HealthcareFieldLabel>Patient</HealthcareFieldLabel>
              <Pressable
                onPress={() => {
                  setPatientSearch('');
                  setPatientHits([]);
                  setPatientPicker(true);
                  void loadPatientsForPicker();
                }}
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
              >
                <Text className="text-slate-800">
                  {selectedPatient
                    ? selectedPatient.full_name
                    : 'Search & select patient'}
                </Text>
              </Pressable>
              <HealthcareFieldLabel>Patient name *</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.patient_name}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, patient_name: v }))
                }
              />
              <HealthcareFieldLabel>Patient phone</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.patient_phone}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, patient_phone: v }))
                }
                keyboardType="phone-pad"
              />
              <WorkshopDatePickerField
                label="Date *"
                value={form.appointment_date}
                onChange={(v) => setForm((f) => ({ ...f, appointment_date: v }))}
              />
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <HealthcareFieldLabel>Start</HealthcareFieldLabel>
                  <TextInput
                    className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                    value={form.start_time}
                    onChangeText={(v) =>
                      setForm((f) => ({ ...f, start_time: v }))
                    }
                  />
                </View>
                <View className="flex-1">
                  <HealthcareFieldLabel>End</HealthcareFieldLabel>
                  <TextInput
                    className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                    value={form.end_time}
                    onChangeText={(v) =>
                      setForm((f) => ({ ...f, end_time: v }))
                    }
                  />
                </View>
              </View>
              <HealthcareFieldLabel>Status</HealthcareFieldLabel>
              <View className="mb-3 flex-row flex-wrap gap-2">
                {APPOINTMENT_STATUSES.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setForm((f) => ({ ...f, status: s }))}
                    className={`rounded-full px-3 py-1 ${form.status === s ? 'bg-teal-600' : 'bg-slate-100'}`}
                  >
                    <Text
                      className={`text-xs capitalize ${form.status === s ? 'text-white' : 'text-slate-700'}`}
                    >
                      {s.replace('_', ' ')}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <HealthcareFieldLabel>Notes</HealthcareFieldLabel>
              <TextInput
                className="mb-4 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.notes}
                onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
                multiline
              />
            </ScrollView>
            <HealthcarePrimaryButton
              label={submitting ? 'Saving…' : 'Save'}
              onPress={() => void submit()}
              disabled={submitting}
            />
            <Pressable
              className="mt-3 items-center py-2"
              onPress={() => setFormOpen(false)}
            >
              <Text className="text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </KeyboardBottomSheetShell>
      </AppModal>

      <AppModal
        visible={rxOpen}
        animationType="slide"
        transparent
        onClose={() => setRxOpen(false)}
      >
        <KeyboardBottomSheetShell overlayColor="rgba(0,0,0,0.4)">
          <View className="max-h-[85%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="mb-2 text-lg font-semibold">New prescription</Text>
            <ScrollView>
              {rxItems.map((row, i) => (
                <View key={i} className="mb-3 rounded-lg border border-slate-200 p-2">
                  <HealthcareFieldLabel>Medicine</HealthcareFieldLabel>
                  <TextInput
                    className="mb-1 rounded border border-slate-100 px-2 py-1 text-slate-900"
                    value={row.medicine_name}
                    onChangeText={(v) => {
                      const next = [...rxItems];
                      next[i] = { ...next[i], medicine_name: v };
                      setRxItems(next);
                    }}
                  />
                  <HealthcareFieldLabel>Dosage / Freq / Duration</HealthcareFieldLabel>
                  <View className="flex-row gap-1">
                    <TextInput
                      className="flex-1 rounded border border-slate-100 px-1 py-1 text-xs text-slate-900"
                      placeholder="Dose"
                      value={row.dosage}
                      onChangeText={(v) => {
                        const next = [...rxItems];
                        next[i] = { ...next[i], dosage: v };
                        setRxItems(next);
                      }}
                    />
                    <TextInput
                      className="flex-1 rounded border border-slate-100 px-1 py-1 text-xs text-slate-900"
                      placeholder="Freq"
                      value={row.frequency}
                      onChangeText={(v) => {
                        const next = [...rxItems];
                        next[i] = { ...next[i], frequency: v };
                        setRxItems(next);
                      }}
                    />
                    <TextInput
                      className="flex-1 rounded border border-slate-100 px-1 py-1 text-xs text-slate-900"
                      placeholder="Dur"
                      value={row.duration}
                      onChangeText={(v) => {
                        const next = [...rxItems];
                        next[i] = { ...next[i], duration: v };
                        setRxItems(next);
                      }}
                    />
                  </View>
                </View>
              ))}
              <Pressable
                onPress={() =>
                  setRxItems((r) => [
                    ...r,
                    {
                      type: 'medicine',
                      medicine_name: '',
                      dosage: '',
                      frequency: '',
                      duration: '',
                    },
                  ])
                }
                className="mb-3"
              >
                <Text className="text-teal-700">+ Add line</Text>
              </Pressable>
              <HealthcareFieldLabel>Notes</HealthcareFieldLabel>
              <TextInput
                className="mb-4 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={rxNotes}
                onChangeText={setRxNotes}
                multiline
              />
            </ScrollView>
            <HealthcarePrimaryButton
              label={rxBusy ? 'Saving…' : 'Save prescription'}
              onPress={() => void submitRx()}
              disabled={rxBusy}
            />
            <Pressable className="mt-2 items-center py-2" onPress={() => setRxOpen(false)}>
              <Text className="text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </KeyboardBottomSheetShell>
      </AppModal>

      <AppModal
        visible={viewRxOpen}
        animationType="slide"
        transparent
        onClose={() => setViewRxOpen(false)}
      >
        <KeyboardBottomSheetShell overlayColor="rgba(0,0,0,0.4)">
          <View className="max-h-[80%] rounded-t-2xl bg-white px-4 pb-6 pt-4">
            <Text className="mb-2 font-semibold text-slate-900">
              Prescriptions · {viewRxApt?.patient_name}
            </Text>
            <FlatList
              data={viewRxList}
              keyExtractor={(x) => x.id}
              ListEmptyComponent={
                <Text className="py-4 text-slate-500">None on file.</Text>
              }
              renderItem={({ item: rx }) => (
                <View className="mb-3 border-b border-slate-100 pb-3">
                  <Text className="text-sm font-medium text-slate-800">
                    {rx.prescription_date}
                  </Text>
                  {rx.items.map((it, j) => (
                    <Text key={j} className="text-xs text-slate-600">
                      {it.medicine_name} {it.dosage} {it.frequency}
                    </Text>
                  ))}
                  <Pressable
                    onPress={() => {
                      Alert.alert('Delete prescription', 'Remove this?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await deletePrescription(rx.id);
                              if (viewRxApt) {
                                const res = await getPrescriptions({
                                  appointment_id: viewRxApt.id,
                                  limit: 100,
                                });
                                setViewRxList(res.prescriptions);
                              }
                            } catch (e) {
                              Alert.alert(
                                'Rx',
                                extractErrorMessage(e, 'Delete failed'),
                              );
                            }
                          },
                        },
                      ]);
                    }}
                    className="mt-1"
                  >
                    <Text className="text-xs text-red-600">Delete</Text>
                  </Pressable>
                </View>
              )}
            />
            <Pressable onPress={() => setViewRxOpen(false)} className="items-center py-2">
              <Text className="text-slate-600">Close</Text>
            </Pressable>
          </View>
        </KeyboardBottomSheetShell>
      </AppModal>

      <AppModal
        visible={invOpen}
        animationType="slide"
        transparent
        onClose={() => setInvOpen(false)}
      >
        <KeyboardBottomSheetShell overlayColor="rgba(0,0,0,0.4)">
          <View className="max-h-[80%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="mb-2 font-semibold">Appointment invoice</Text>
            <ScrollView>
              {invLines.map((line, i) => (
                <View key={i} className="mb-2 flex-row gap-2">
                  <TextInput
                    className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-slate-900"
                    placeholder="Description"
                    value={line.description}
                    onChangeText={(v) => {
                      const next = [...invLines];
                      next[i] = { ...next[i], description: v };
                      setInvLines(next);
                    }}
                  />
                  <TextInput
                    className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-slate-900"
                    placeholder="Amt"
                    keyboardType="decimal-pad"
                    value={line.amount ? String(line.amount) : ''}
                    onChangeText={(v) => {
                      const next = [...invLines];
                      next[i] = {
                        ...next[i],
                        amount: parseFloat(v) || 0,
                      };
                      setInvLines(next);
                    }}
                  />
                </View>
              ))}
              <Pressable
                onPress={() =>
                  setInvLines((l) => [...l, { description: '', amount: 0 }])
                }
                className="mb-3"
              >
                <Text className="text-teal-700">+ Line</Text>
              </Pressable>
            </ScrollView>
            <HealthcarePrimaryButton
              label={invBusy ? 'Creating…' : 'Create invoice'}
              onPress={() => void submitInv()}
              disabled={invBusy}
            />
            <Pressable className="mt-2 items-center py-2" onPress={() => setInvOpen(false)}>
              <Text className="text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </KeyboardBottomSheetShell>
      </AppModal>
    </HealthcareChrome>
  );
}
