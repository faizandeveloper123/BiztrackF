import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import {
  fetchSuppliers,
  createSupplier,
  deleteSupplier,
} from '../../../services/hrm/hrmMobileApi';
import type { Supplier } from '../../../models/hrm';
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
  WorkshopOutlineButton,
  WorkshopDetailRow,
  WS,
} from '../../workshop/components/WorkshopChrome';

export function MobileHrmSuppliersScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageHRM } = usePermissions();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [detail, setDetail] = useState<Supplier | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchSuppliers(0, 200);
      setRows(res.suppliers ?? []);
    } catch (e) {
      appError('HRM', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/hrm/suppliers',
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

  const submit = async () => {
    if (!name.trim() || !code.trim()) {
      appAlert('HRM', 'Name and code are required.');
      return;
    }
    try {
      await createSupplier({
        name: name.trim(),
        code: code.trim(),
        isActive: true,
      });
      setOpen(false);
      setName('');
      setCode('');
      await load();
    } catch (e) {
      appError('HRM', extractErrorMessage(e, 'Failed to save'));
    }
  };

  const remove = (s: Supplier) => {
    appConfirm({
      title: 'Delete supplier',
      message: s.name,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteSupplier(s.id);
          setDetail(null);
          await load();
        } catch (e) {
          appError('HRM', extractErrorMessage(e, 'Failed to delete'));
        }
      },
    });
  };

  return (
    <WorkshopChrome
      title="Suppliers"
      subtitle="Vendor directory"
      right={canManageHRM() ? <WorkshopHeaderButton onPress={() => setOpen(true)} /> : undefined}
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
              icon="business-outline"
              title="No suppliers"
              subtitle="Add vendors to your supplier directory."
              actionLabel={canManageHRM() ? 'Add supplier' : undefined}
              onAction={canManageHRM() ? () => setOpen(true) : undefined}
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="business"
              iconColor="#64748b"
              iconBg="#f1f5f9"
              title={item.name}
              subtitle={item.code}
              meta={item.email || item.phone || undefined}
              onPress={() => setDetail(item)}
              actions={
                canManageHRM()
                  ? [{ icon: 'trash-outline', onPress: () => remove(item), danger: true }]
                  : undefined
              }
            />
          )}
        />
      )}

      <WorkshopFormSheet
        visible={open}
        title="New supplier"
        onClose={() => setOpen(false)}
        footer={
          <>
            <WorkshopPrimaryButton label="Save supplier" onPress={() => void submit()} />
            <Pressable onPress={() => setOpen(false)} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        <WorkshopFieldLabel>Name *</WorkshopFieldLabel>
        <WorkshopTextInput value={name} onChangeText={setName} />
        <WorkshopFieldLabel>Code *</WorkshopFieldLabel>
        <WorkshopTextInput value={code} onChangeText={setCode} autoCapitalize="characters" />
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={detail != null}
        title="Supplier"
        onClose={() => setDetail(null)}
        footer={
          <>
            {detail && canManageHRM() ? (
              <View style={{ marginBottom: 8 }}>
                <Pressable
                  onPress={() => remove(detail)}
                  style={{ alignItems: 'center', borderRadius: 14, paddingVertical: 15, backgroundColor: WS.dangerBg }}
                >
                  <Text style={{ fontWeight: '700', fontSize: 16, color: WS.danger }}>Delete</Text>
                </Pressable>
              </View>
            ) : null}
            <WorkshopOutlineButton label="Close" onPress={() => setDetail(null)} />
          </>
        }
      >
        {detail ? (
          <>
            <Text style={{ fontSize: 22, fontWeight: '800', color: WS.text, marginBottom: 12 }}>{detail.name}</Text>
            <WorkshopDetailRow label="Code" value={detail.code} />
            {detail.email ? <WorkshopDetailRow label="Email" value={detail.email} /> : null}
            {detail.phone ? <WorkshopDetailRow label="Phone" value={detail.phone} /> : null}
          </>
        ) : null}
      </WorkshopFormSheet>
    </WorkshopChrome>
  );
}
