import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from '../../../services/inventory/inventoryMobileApi';
import type { Warehouse, WarehouseCreate } from '../../../models/inventory';
import { usePermissions } from '../../../hooks/usePermissions';
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
} from '../../workshop/components/WorkshopChrome';

export function MobileWarehousesScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageInventory } = usePermissions();
  const [rows, setRows] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const load = useCallback(async () => {
    const res = await getWarehouses();
    setRows(res.warehouses ?? []);
  }, []);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch (e) {
        appError('Warehouses', extractErrorMessage(e, 'Failed to load'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [load],
  );

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/inventory/warehouses',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void run(false);
  }, [run]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.code.toLowerCase().includes(q) ||
        w.city.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCode('');
    setAddress('');
    setCity('');
    setState('');
    setCountry('');
    setPostalCode('');
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (w: Warehouse) => {
    setEditingId(w.id);
    setName(w.name);
    setCode(w.code);
    setAddress(w.address);
    setCity(w.city);
    setState(w.state || '');
    setCountry(w.country || '');
    setPostalCode(w.postalCode || '');
    setOpen(true);
  };

  const submit = async () => {
    if (!name.trim() || !code.trim() || !address.trim() || !city.trim()) {
      appAlert('Warehouses', 'Name, code, address, and city are required.');
      return;
    }
    const payload: WarehouseCreate = {
      name: name.trim(),
      code: code.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim() || '—',
      country: country.trim() || '—',
      postalCode: postalCode.trim() || '0000',
      isActive: true,
    };
    try {
      setSaving(true);
      if (editingId) {
        await updateWarehouse(editingId, payload);
      } else {
        await createWarehouse(payload);
      }
      setOpen(false);
      resetForm();
      await run(false);
    } catch (e) {
      appError('Warehouses', extractErrorMessage(e, 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (w: Warehouse) => {
    appConfirm({
      title: 'Delete warehouse',
      message: w.name,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteWarehouse(w.id);
          await run(false);
        } catch (e) {
          appError('Warehouses', extractErrorMessage(e, 'Failed to delete'));
        }
      },
    });
  };

  return (
    <WorkshopChrome
      title="Warehouses"
      subtitle="Sites & distribution centers"
      right={canManageInventory() ? <WorkshopHeaderButton onPress={openCreate} /> : <View style={{ width: 72 }} />}
      scroll={false}
    >
      <WorkshopSearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search name, code, city…"
      />

      {loading && !refreshing ? (
        <WorkshopLoading />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(item) => item.id}
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
              icon="business-outline"
              title="No warehouses"
              subtitle="Add warehouses to organize stock across locations."
              actionLabel={canManageInventory() ? 'Add warehouse' : undefined}
              onAction={canManageInventory() ? openCreate : undefined}
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="business"
              iconColor="#4f46e5"
              iconBg="#eef2ff"
              title={item.name}
              subtitle={item.code}
              meta={`${item.city}, ${item.country}`}
              onPress={canManageInventory() ? () => openEdit(item) : undefined}
              actions={
                canManageInventory()
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
        visible={open}
        title={editingId ? 'Edit warehouse' : 'New warehouse'}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        footer={
          <>
            <WorkshopPrimaryButton
              label={saving ? 'Saving…' : 'Save warehouse'}
              onPress={() => void submit()}
              disabled={saving}
            />
            <Pressable
              onPress={() => {
                setOpen(false);
                resetForm();
              }}
              style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}
            >
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        <WorkshopFieldLabel>Name *</WorkshopFieldLabel>
        <WorkshopTextInput value={name} onChangeText={setName} />
        <WorkshopFieldLabel>Code *</WorkshopFieldLabel>
        <WorkshopTextInput value={code} onChangeText={setCode} autoCapitalize="characters" />
        <WorkshopFieldLabel>Address *</WorkshopFieldLabel>
        <WorkshopTextInput value={address} onChangeText={setAddress} />
        <WorkshopFieldLabel>City *</WorkshopFieldLabel>
        <WorkshopTextInput value={city} onChangeText={setCity} />
        <WorkshopFieldLabel>State</WorkshopFieldLabel>
        <WorkshopTextInput value={state} onChangeText={setState} />
        <WorkshopFieldLabel>Country</WorkshopFieldLabel>
        <WorkshopTextInput value={country} onChangeText={setCountry} />
        <WorkshopFieldLabel>Postal code</WorkshopFieldLabel>
        <WorkshopTextInput value={postalCode} onChangeText={setPostalCode} />
      </WorkshopFormSheet>
    </WorkshopChrome>
  );
}
