import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import {
  getWarehouses,
  getStorageLocations,
  createStorageLocation,
  deleteStorageLocation,
} from '../../../services/inventory/inventoryMobileApi';
import type { StorageLocation, StorageLocationCreate, Warehouse } from '../../../models/inventory';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  WorkshopChrome,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopPrimaryButton,
  WorkshopFilterBar,
  countActiveFilters,
  WS,
} from '../../workshop/components/WorkshopChrome';

export function MobileStorageLocationsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageInventory } = usePermissions();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [rows, setRows] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [locationType, setLocationType] = useState('shelf');

  const load = useCallback(async () => {
    const wr = await getWarehouses();
    const list = wr.warehouses ?? [];
    setWarehouses(list);
    let wid = warehouseId;
    if (!wid && list[0]) {
      wid = list[0].id;
      setWarehouseId(wid);
    }
    const res = await getStorageLocations(wid || undefined);
    setRows(res.storageLocations ?? []);
  }, [warehouseId]);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch (e) {
        appError('Storage', extractErrorMessage(e, 'Failed to load'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [load],
  );

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard'
        ? '/dashboard'
        : '/inventory/storage-locations',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void run(false);
  }, [run]);

  const submit = async () => {
    const wid = warehouseId || warehouses[0]?.id;
    if (!wid || !name.trim() || !code.trim()) {
      appAlert('Storage', 'Warehouse, name, and code are required.');
      return;
    }
    const payload: StorageLocationCreate = {
      warehouseId: wid,
      name: name.trim(),
      code: code.trim(),
      locationType: locationType.trim() || 'shelf',
      isActive: true,
    };
    try {
      setSaving(true);
      await createStorageLocation(payload);
      setOpen(false);
      setName('');
      setCode('');
      await run(false);
    } catch (e) {
      appError('Storage', extractErrorMessage(e, 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (s: StorageLocation) => {
    appConfirm({
      title: 'Delete location',
      message: s.name,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteStorageLocation(s.id);
          await run(false);
        } catch (e) {
          appError('Storage', extractErrorMessage(e, 'Failed to delete'));
        }
      },
    });
  };

  return (
    <WorkshopChrome
      title="Storage"
      subtitle="Bins, shelves & locations"
      right={canManageInventory() ? <WorkshopHeaderButton onPress={() => setOpen(true)} /> : <View style={{ width: 72 }} />}
      scroll={false}
    >
      <WorkshopFilterBar
        resultCount={rows.length}
        activeFilterCount={countActiveFilters([warehouseId])}
        onResetFilters={() => setWarehouseId('')}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: WS.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            marginBottom: 8,
          }}
        >
          Warehouse
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 2 }}>
            {warehouses.map((w) => {
              const active = warehouseId === w.id;
              return (
                <Pressable
                  key={w.id}
                  onPress={() => setWarehouseId(w.id)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: active ? WS.primary : '#f1f5f9',
                    borderWidth: 1,
                    borderColor: active ? WS.primary : WS.border,
                    maxWidth: 180,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: active ? '#fff' : '#475569',
                    }}
                    numberOfLines={1}
                  >
                    {w.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </WorkshopFilterBar>

      {loading && !refreshing ? (
        <WorkshopLoading />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={rows}
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
              icon="location-outline"
              title="No locations"
              subtitle="Add storage locations within this warehouse."
              actionLabel={canManageInventory() ? 'Add location' : undefined}
              onAction={canManageInventory() ? () => setOpen(true) : undefined}
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="location"
              iconColor="#2563eb"
              iconBg="#eff6ff"
              title={item.name}
              subtitle={item.code}
              meta={item.locationType}
              actions={
                canManageInventory()
                  ? [{ icon: 'trash-outline', onPress: () => remove(item), danger: true }]
                  : undefined
              }
            />
          )}
        />
      )}

      <WorkshopFormSheet
        visible={open}
        title="New location"
        onClose={() => setOpen(false)}
        footer={
          <>
            <WorkshopPrimaryButton
              label={saving ? 'Saving…' : 'Save location'}
              onPress={() => void submit()}
              disabled={saving}
            />
            <Pressable
              onPress={() => setOpen(false)}
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
        <WorkshopFieldLabel>Type</WorkshopFieldLabel>
        <WorkshopTextInput value={locationType} onChangeText={setLocationType} />
      </WorkshopFormSheet>
    </WorkshopChrome>
  );
}
