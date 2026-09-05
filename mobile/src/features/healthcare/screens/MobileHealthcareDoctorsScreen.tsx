import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import type {
  Doctor,
  DoctorCreate,
  DoctorAvailabilitySlot,
} from '../../../models/healthcare';
import { DAYS_OF_WEEK } from '../../../models/healthcare';
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from '../../../services/healthcare/healthcareMobileApi';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { AppModal } from '../../../components/layout/AppModal';
import { KeyboardBottomSheetShell } from '../../../components/layout/KeyboardBottomSheetShell';
import {
  HealthcareChrome,
  HealthcareCard,
  HealthcareFieldLabel,
  HealthcarePrimaryButton,
  HealthcareOutlineButton,
} from '../components/HealthcareChrome';

const PAGE_SIZE = 20;

const emptyForm: DoctorCreate = {
  pmdc_number: '',
  phone: '',
  first_name: '',
  last_name: '',
  email: '',
  specialization: '',
  qualification: '',
  address: '',
  availability: [],
};

export function MobileHealthcareDoctorsScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [list, setList] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<DoctorCreate>(emptyForm);

  useEffect(() => {
    setSidebarActivePath('/healthcare/doctors');
  }, [setSidebarActivePath]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced]);

  const load = useCallback(async () => {
    const res = await getDoctors({
      search: debounced.trim() || undefined,
      page,
      limit: PAGE_SIZE,
    });
    setList(res.doctors);
    setTotal(res.total);
  }, [debounced, page]);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch (e) {
        Alert.alert('Doctors', extractErrorMessage(e, 'Failed to load'));
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
    setForm({ ...emptyForm, availability: [] });
    setFormOpen(true);
  };

  const openEdit = (d: Doctor) => {
    setEditing(d);
    setForm({
      pmdc_number: d.pmdc_number,
      phone: d.phone,
      first_name: d.first_name,
      last_name: d.last_name,
      email: d.email ?? '',
      specialization: d.specialization ?? '',
      qualification: d.qualification ?? '',
      address: d.address ?? '',
      availability: d.availability?.length ? [...d.availability] : [],
    });
    setFormOpen(true);
  };

  const addSlot = () => {
    setForm((f) => ({
      ...f,
      availability: [
        ...f.availability,
        { day: 'Monday', start_time: '09:00', end_time: '17:00' },
      ],
    }));
  };

  const updateSlot = (
    i: number,
    field: keyof DoctorAvailabilitySlot,
    value: string,
  ) => {
    setForm((f) => {
      const next = [...f.availability];
      next[i] = { ...next[i], [field]: value };
      return { ...f, availability: next };
    });
  };

  const removeSlot = (i: number) => {
    setForm((f) => ({
      ...f,
      availability: f.availability.filter((_, j) => j !== i),
    }));
  };

  const submit = async () => {
    if (!form.pmdc_number.trim() || !form.phone.trim()) {
      Alert.alert('Doctors', 'PMDC number and phone are required');
      return;
    }
    if (!form.first_name.trim() || !form.last_name.trim()) {
      Alert.alert('Doctors', 'First and last name are required');
      return;
    }
    try {
      setSubmitting(true);
      if (editing) {
        await updateDoctor(editing.id, {
          ...form,
          pmdc_number: form.pmdc_number.trim(),
          phone: form.phone.trim(),
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
        });
      } else {
        await createDoctor({
          ...form,
          pmdc_number: form.pmdc_number.trim(),
          phone: form.phone.trim(),
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
        });
      }
      setFormOpen(false);
      await run(false);
    } catch (e) {
      Alert.alert('Doctors', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = (d: Doctor) => {
    Alert.alert('Delete doctor', `Remove Dr. ${d.first_name} ${d.last_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoctor(d.id);
            await run(false);
          } catch (e) {
            Alert.alert('Doctors', extractErrorMessage(e, 'Delete failed'));
          }
        },
      },
    ]);
  };

  return (
    <HealthcareChrome
      title="Doctors"
      subtitle="Clinical staff directory"
      right={
        <Pressable onPress={openAdd} className="p-2">
          <Ionicons name="add-circle" size={26} color="#0d9488" />
        </Pressable>
      }
      scroll={false}
    >
      <TextInput
        className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
        placeholder="Search…"
        placeholderTextColor="#94a3b8"
        value={search}
        onChangeText={setSearch}
      />

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
              No doctors found.
            </Text>
          }
          renderItem={({ item }) => (
            <HealthcareCard>
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-base font-semibold text-slate-900">
                    Dr. {item.first_name} {item.last_name}
                  </Text>
                  <Text className="text-sm text-slate-600">
                    PMDC {item.pmdc_number}
                  </Text>
                  <Text className="text-xs text-slate-500">{item.phone}</Text>
                  {item.specialization ? (
                    <Text className="text-xs text-teal-700">
                      {item.specialization}
                    </Text>
                  ) : null}
                </View>
                <View className="flex-row gap-2">
                  <Pressable onPress={() => openEdit(item)} hitSlop={8}>
                    <Ionicons name="pencil" size={20} color="#475569" />
                  </Pressable>
                  <Pressable onPress={() => remove(item)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color="#b91c1c" />
                  </Pressable>
                </View>
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

      <AppModal
        visible={formOpen}
        animationType="slide"
        transparent
        onClose={() => setFormOpen(false)}
      >
        <KeyboardBottomSheetShell overlayColor="rgba(0,0,0,0.4)">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="mb-4 text-lg font-semibold text-slate-900">
              {editing ? 'Edit doctor' : 'Add doctor'}
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <HealthcareFieldLabel>PMDC number *</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.pmdc_number}
                onChangeText={(v) => setForm((f) => ({ ...f, pmdc_number: v }))}
              />
              <HealthcareFieldLabel>Phone *</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.phone}
                onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
                keyboardType="phone-pad"
              />
              <HealthcareFieldLabel>First name *</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.first_name}
                onChangeText={(v) => setForm((f) => ({ ...f, first_name: v }))}
              />
              <HealthcareFieldLabel>Last name *</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.last_name}
                onChangeText={(v) => setForm((f) => ({ ...f, last_name: v }))}
              />
              <HealthcareFieldLabel>Email</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.email}
                onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <HealthcareFieldLabel>Specialization</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.specialization}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, specialization: v }))
                }
              />
              <HealthcareFieldLabel>Qualification</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.qualification}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, qualification: v }))
                }
              />
              <HealthcareFieldLabel>Address</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.address}
                onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
                multiline
              />

              <View className="mb-2 mt-2 flex-row items-center justify-between">
                <Text className="font-semibold text-slate-800">Availability</Text>
                <Pressable
                  onPress={addSlot}
                  className="rounded-lg bg-teal-100 px-3 py-1"
                >
                  <Text className="text-sm font-medium text-teal-800">+ Slot</Text>
                </Pressable>
              </View>
              {form.availability.map((slot, i) => (
                <View
                  key={i}
                  className="mb-3 rounded-lg border border-slate-200 p-3"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-medium text-slate-700">
                      Slot {i + 1}
                    </Text>
                    <Pressable onPress={() => removeSlot(i)}>
                      <Ionicons name="close-circle" size={22} color="#94a3b8" />
                    </Pressable>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="mt-2 flex-row flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <Pressable
                          key={day}
                          onPress={() => updateSlot(i, 'day', day)}
                          className={`rounded-full px-3 py-1 ${slot.day === day ? 'bg-teal-600' : 'bg-slate-100'}`}
                        >
                          <Text
                            className={`text-xs ${slot.day === day ? 'text-white' : 'text-slate-700'}`}
                          >
                            {day.slice(0, 3)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                  <View className="mt-2 flex-row gap-2">
                    <View className="flex-1">
                      <HealthcareFieldLabel>Start</HealthcareFieldLabel>
                      <TextInput
                        className="rounded-lg border border-slate-200 px-2 py-1 text-slate-900"
                        value={slot.start_time}
                        onChangeText={(v) => updateSlot(i, 'start_time', v)}
                        placeholder="09:00"
                      />
                    </View>
                    <View className="flex-1">
                      <HealthcareFieldLabel>End</HealthcareFieldLabel>
                      <TextInput
                        className="rounded-lg border border-slate-200 px-2 py-1 text-slate-900"
                        value={slot.end_time}
                        onChangeText={(v) => updateSlot(i, 'end_time', v)}
                        placeholder="17:00"
                      />
                    </View>
                  </View>
                </View>
              ))}
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
    </HealthcareChrome>
  );
}
