import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import type { Patient } from '../../../models/healthcare';
import {
  getPatients,
  getPatientHistory,
} from '../../../services/healthcare/healthcareMobileApi';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  HealthcareChrome,
  HealthcareCard,
} from '../components/HealthcareChrome';

export function MobileHealthcarePatientHistoryScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [hits, setHits] = useState<Patient[]>([]);
  const [loadingHits, setLoadingHits] = useState(false);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [loadingHist, setLoadingHist] = useState(false);
  const [hist, setHist] = useState<Awaited<
    ReturnType<typeof getPatientHistory>
  > | null>(null);

  useEffect(() => {
    setSidebarActivePath('/healthcare/patient-history');
  }, [setSidebarActivePath]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const searchPatients = useCallback(async () => {
    try {
      setLoadingHits(true);
      const res = await getPatients({
        search: debounced.trim() || undefined,
        limit: 40,
      });
      setHits(res.patients);
    } catch (e) {
      Alert.alert('Patients', extractErrorMessage(e, 'Search failed'));
    } finally {
      setLoadingHits(false);
    }
  }, [debounced]);

  useEffect(() => {
    void searchPatients();
  }, [searchPatients]);

  const openPatient = async (p: Patient) => {
    setSelected(p);
    try {
      setLoadingHist(true);
      const h = await getPatientHistory(p.id);
      setHist(h);
    } catch (e) {
      Alert.alert('History', extractErrorMessage(e, 'Failed to load'));
      setHist(null);
    } finally {
      setLoadingHist(false);
    }
  };

  return (
    <HealthcareChrome
      title="Patient history"
      subtitle="Appointments and prescriptions"
      scroll={false}
    >
      <TextInput
        className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
        placeholder="Search patient…"
        placeholderTextColor="#94a3b8"
        value={q}
        onChangeText={setQ}
      />

      {!selected ? (
        loadingHits ? (
          <View className="py-12 items-center">
            <ActivityIndicator color="#0d9488" />
          </View>
        ) : (
          <FlatList
            className="flex-1"
            data={hits}
            keyExtractor={(x) => x.id}
            ListEmptyComponent={
              <Text className="py-8 text-center text-slate-500">
                Type to search patients.
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable onPress={() => void openPatient(item)}>
                <HealthcareCard>
                  <Text className="font-semibold text-slate-900">
                    {item.full_name}
                  </Text>
                  {item.phone ? (
                    <Text className="text-sm text-slate-600">{item.phone}</Text>
                  ) : null}
                </HealthcareCard>
              </Pressable>
            )}
          />
        )
      ) : (
        <ScrollView className="flex-1">
          <Pressable
            onPress={() => {
              setSelected(null);
              setHist(null);
            }}
            className="mb-3"
          >
            <Text className="text-teal-700">← Back to search</Text>
          </Pressable>
          <HealthcareCard>
            <Text className="text-lg font-bold text-slate-900">
              {selected.full_name}
            </Text>
            <Text className="text-sm text-slate-600">{selected.phone}</Text>
          </HealthcareCard>
          {loadingHist ? (
            <ActivityIndicator className="mt-6" color="#0d9488" />
          ) : hist ? (
            <>
              <Text className="mb-2 mt-4 font-semibold text-slate-800">
                Appointments
              </Text>
              {hist.appointments.length === 0 ? (
                <Text className="text-slate-500">None.</Text>
              ) : (
                hist.appointments.map((a) => (
                  <View
                    key={a.id}
                    className="mb-2 rounded-lg border border-slate-100 bg-white p-3"
                  >
                    <Text className="font-medium text-slate-800">
                      {a.appointment_date} {a.start_time}
                    </Text>
                    <Text className="text-xs capitalize text-slate-500">
                      {a.status}
                    </Text>
                  </View>
                ))
              )}
              <Text className="mb-2 mt-4 font-semibold text-slate-800">
                Prescriptions
              </Text>
              {hist.prescriptions.length === 0 ? (
                <Text className="text-slate-500">None.</Text>
              ) : (
                hist.prescriptions.map((rx) => (
                  <View
                    key={rx.id}
                    className="mb-2 rounded-lg border border-slate-100 bg-white p-3"
                  >
                    <Text className="font-medium text-slate-800">
                      {rx.prescription_date}
                    </Text>
                    {rx.items.map((it, i) => (
                      <Text key={i} className="text-xs text-slate-600">
                        {it.medicine_name} {it.dosage}
                      </Text>
                    ))}
                  </View>
                ))
              )}
            </>
          ) : null}
        </ScrollView>
      )}
    </HealthcareChrome>
  );
}
