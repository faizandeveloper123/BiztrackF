import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import type { Vehicle, VehicleCreate, VehicleUpdate } from '../../../models/workshop/Vehicle';
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../../../services/workshop/workshopMobileApi';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
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
  WorkshopPrimaryButton,
  WS,
} from '../components/WorkshopChrome';
import {
  validateVehicleForm,
  vehiclePayloadForSubmit,
} from '../vehicleFormValidation';

export function MobileWorkshopVehiclesScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [list, setList] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    vin: '',
    registration_number: '',
    mileage: '',
    engine_number: '',
    notes: '',
  });

  useEffect(() => {
    setSidebarActivePath('/workshop-management/vehicles');
  }, [setSidebarActivePath]);

  const load = useCallback(async () => {
    const data = await getVehicles();
    setList(data);
  }, []);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch (e) {
        appError('Vehicles', extractErrorMessage(e, 'Failed to load'));
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

  const filtered = list.filter((v) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (v.make || '').toLowerCase().includes(q) ||
      (v.model || '').toLowerCase().includes(q) ||
      (v.registration_number || '').toLowerCase().includes(q) ||
      (v.vin || '').toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      make: '',
      model: '',
      year: '',
      color: '',
      vin: '',
      registration_number: '',
      mileage: '',
      engine_number: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      make: v.make || '',
      model: v.model || '',
      year: v.year || '',
      color: v.color || '',
      vin: v.vin || '',
      registration_number: v.registration_number || '',
      mileage: v.mileage || '',
      engine_number: v.engine_number || '',
      notes: v.notes || '',
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const isCreate = !editing;
    const err = validateVehicleForm(isCreate, form);
    if (err) {
      appAlert('Vehicle', err);
      return;
    }
    const payload = vehiclePayloadForSubmit(form, isCreate);
    try {
      setSaving(true);
      if (editing) {
        await updateVehicle(editing.id, payload as VehicleUpdate);
      } else {
        await createVehicle(payload as VehicleCreate);
      }
      setModalOpen(false);
      await run(false);
    } catch (e) {
      appError('Vehicle', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (v: Vehicle) => {
    appConfirm({
      title: 'Delete vehicle',
      message: v.registration_number || v.vin || v.id,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteVehicle(v.id);
          await run(false);
        } catch (e) {
          appError('Vehicle', extractErrorMessage(e, 'Delete failed'));
        }
      },
    });
  };

  return (
    <WorkshopChrome
      title="Vehicles"
      subtitle="Fleet & customer vehicles"
      right={<WorkshopHeaderButton onPress={openCreate} />}
      scroll={false}
    >
      <WorkshopSearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search reg, VIN, make…"
      />

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
              icon="car-outline"
              title="No vehicles"
              subtitle="Add vehicles to your fleet or link customer vehicles."
              actionLabel="Add vehicle"
              onAction={openCreate}
            />
          }
          renderItem={({ item: v }) => (
            <WorkshopListCard
              kind="vehicle"
              icon="car"
              iconColor="#7c3aed"
              iconBg="#f5f3ff"
              kicker={v.registration_number || 'No registration'}
              title={[v.make, v.model].filter(Boolean).join(' ') || 'Vehicle'}
              subtitle={[v.year, v.color].filter(Boolean).join(' · ') || undefined}
              meta={[v.mileage ? `${v.mileage} km` : '', v.vin ? `VIN ${v.vin}` : ''].filter(Boolean).join(' · ') || undefined}
              onPress={() => openEdit(v)}
              actions={[
                { icon: 'create-outline', onPress: () => openEdit(v) },
                { icon: 'trash-outline', onPress: () => remove(v), danger: true },
              ]}
            />
          )}
        />
      )}

      <WorkshopFormSheet
        visible={modalOpen}
        title={editing ? 'Edit vehicle' : 'New vehicle'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <WorkshopPrimaryButton
              label={saving ? 'Saving…' : 'Save vehicle'}
              onPress={() => void submit()}
              disabled={saving}
            />
            <Pressable onPress={() => setModalOpen(false)} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        <WorkshopFieldLabel>Registration number *</WorkshopFieldLabel>
        <WorkshopTextInput value={form.registration_number} onChangeText={(v) => setForm((f) => ({ ...f, registration_number: v }))} />
        <WorkshopFieldLabel>VIN</WorkshopFieldLabel>
        <WorkshopTextInput value={form.vin} onChangeText={(v) => setForm((f) => ({ ...f, vin: v }))} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <WorkshopFieldLabel>Make *</WorkshopFieldLabel>
            <WorkshopTextInput value={form.make} onChangeText={(v) => setForm((f) => ({ ...f, make: v }))} />
          </View>
          <View style={{ flex: 1 }}>
            <WorkshopFieldLabel>Model *</WorkshopFieldLabel>
            <WorkshopTextInput value={form.model} onChangeText={(v) => setForm((f) => ({ ...f, model: v }))} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ width: 96 }}>
            <WorkshopFieldLabel>Year</WorkshopFieldLabel>
            <WorkshopTextInput value={form.year} onChangeText={(v) => setForm((f) => ({ ...f, year: v }))} />
          </View>
          <View style={{ flex: 1 }}>
            <WorkshopFieldLabel>Color</WorkshopFieldLabel>
            <WorkshopTextInput value={form.color} onChangeText={(v) => setForm((f) => ({ ...f, color: v }))} />
          </View>
        </View>
        <WorkshopFieldLabel>Mileage</WorkshopFieldLabel>
        <WorkshopTextInput value={form.mileage} onChangeText={(v) => setForm((f) => ({ ...f, mileage: v }))} />
        <WorkshopFieldLabel>Engine Number</WorkshopFieldLabel>
        <WorkshopTextInput value={form.engine_number} onChangeText={(v) => setForm((f) => ({ ...f, engine_number: v }))} />
        <WorkshopFieldLabel>Notes</WorkshopFieldLabel>
        <WorkshopTextInput value={form.notes} onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))} multiline />
      </WorkshopFormSheet>
    </WorkshopChrome>
  );
}
