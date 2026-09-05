import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import type { Patient, PatientCreate } from '../../../models/healthcare';
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
} from '../../../services/healthcare/healthcareMobileApi';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { AppModal } from '../../../components/layout/AppModal';
import {
  HealthcareChrome,
  HealthcareCard,
  HealthcareFieldLabel,
  HealthcarePrimaryButton,
  HealthcareOutlineButton,
} from '../components/HealthcareChrome';
import { WorkshopDatePickerField } from '../../workshop/components/WorkshopChrome';
import { KeyboardBottomSheetShell } from '../../../components/layout/KeyboardBottomSheetShell';

const PAGE_SIZE = 20;

export function MobileHealthcarePatientsScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [list, setList] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<PatientCreate>({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    setSidebarActivePath('/healthcare/patients');
  }, [setSidebarActivePath]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced]);

  const load = useCallback(async () => {
    const res = await getPatients({
      search: debounced.trim() || undefined,
      page,
      limit: PAGE_SIZE,
    });
    setList(res.patients);
    setTotal(res.total);
  }, [debounced, page]);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch (e) {
        Alert.alert('Patients', extractErrorMessage(e, 'Failed to load'));
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
      full_name: '',
      phone: '',
      email: '',
      date_of_birth: '',
      address: '',
      notes: '',
    });
    setFormOpen(true);
  };

  const openEdit = (p: Patient) => {
    setEditing(p);
    setForm({
      full_name: p.full_name,
      phone: p.phone ?? '',
      email: p.email ?? '',
      date_of_birth: p.date_of_birth ?? '',
      address: p.address ?? '',
      notes: p.notes ?? '',
    });
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.full_name.trim()) {
      Alert.alert('Patients', 'Full name is required');
      return;
    }
    try {
      setSubmitting(true);
      const payload: PatientCreate = {
        full_name: form.full_name.trim(),
        phone: form.phone?.trim() || undefined,
        email: form.email?.trim() || undefined,
        date_of_birth: form.date_of_birth?.trim() || undefined,
        address: form.address?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      };
      if (editing) {
        await updatePatient(editing.id, payload);
      } else {
        await createPatient(payload);
      }
      setFormOpen(false);
      await run(false);
    } catch (e) {
      Alert.alert('Patients', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = (p: Patient) => {
    Alert.alert('Delete patient', `Remove ${p.full_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePatient(p.id);
            await run(false);
          } catch (e) {
            Alert.alert('Patients', extractErrorMessage(e, 'Delete failed'));
          }
        },
      },
    ]);
  };

  return (
    <HealthcareChrome
      title="Patients"
      subtitle="Manage patients for appointments"
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
              No patients found.
            </Text>
          }
          renderItem={({ item }) => (
            <HealthcareCard>
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-base font-semibold text-slate-900">
                    {item.full_name}
                  </Text>
                  {item.phone ? (
                    <Text className="text-sm text-slate-600">{item.phone}</Text>
                  ) : null}
                  {item.email ? (
                    <Text className="text-xs text-slate-500">{item.email}</Text>
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
          <View className="max-h-[90%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="mb-4 text-lg font-semibold text-slate-900">
              {editing ? 'Edit patient' : 'Add patient'}
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <HealthcareFieldLabel>Full name *</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.full_name}
                onChangeText={(v) => setForm((f) => ({ ...f, full_name: v }))}
              />
              <HealthcareFieldLabel>Phone</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.phone}
                onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
                keyboardType="phone-pad"
              />
              <HealthcareFieldLabel>Email</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.email}
                onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <WorkshopDatePickerField
                label="Date of birth"
                value={form.date_of_birth ?? ''}
                onChange={(v) => setForm((f) => ({ ...f, date_of_birth: v }))}
              />
              <HealthcareFieldLabel>Address</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.address}
                onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
                multiline
              />
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
    </HealthcareChrome>
  );
}
