import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import {
  getPurchaseOrders,
  createPurchaseOrder,
  deletePurchaseOrder,
  getWarehouses,
} from '../../../services/inventory/inventoryMobileApi';
import { fetchSuppliers } from '../../../services/inventory/hrmSuppliersApi';
import { PurchaseOrderStatus } from '../../../models/inventory';
import type {
  Warehouse,
  PurchaseOrder,
  PurchaseOrderCreate,
} from '../../../models/inventory';
import type { Supplier } from '../../../models/hrm/supplier';
import {
  WorkshopChrome,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopDatePickerField,
  WorkshopPrimaryButton,
  WS,
} from '../../workshop/components/WorkshopChrome';

function defaultExpectedDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function OptionChips(props: {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
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
        {props.label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 2 }}>
          {props.options.map((opt) => {
            const active = props.value === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => props.onChange(opt.id)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: active ? WS.primaryLight : '#fafafa',
                  borderWidth: 1,
                  borderColor: active ? WS.primary : WS.border,
                  maxWidth: 200,
                }}
              >
                <Text
                  style={{ fontSize: 13, fontWeight: '600', color: active ? WS.primaryDark : WS.text }}
                  numberOfLines={1}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export function MobilePurchaseOrdersScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageInventory } = usePermissions();
  const [rows, setRows] = useState<PurchaseOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(defaultExpectedDate);
  const [status, setStatus] = useState<PurchaseOrderStatus>(PurchaseOrderStatus.DRAFT);
  const [notes, setNotes] = useState('');

  const requiresDelivery =
    status !== PurchaseOrderStatus.ARRIVED && status !== PurchaseOrderStatus.CANCELLED;

  const load = useCallback(async () => {
    const res = await getPurchaseOrders();
    setRows(res.purchaseOrders ?? []);
  }, []);

  const loadMeta = useCallback(async () => {
    const [whRes, supRes] = await Promise.all([getWarehouses(), fetchSuppliers()]);
    setWarehouses(whRes.warehouses ?? []);
    setSuppliers(supRes.suppliers ?? []);
    setSupplierId((prev) => prev || supRes.suppliers?.[0]?.id || '');
    setWarehouseId((prev) => prev || whRes.warehouses?.[0]?.id || '');
  }, []);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch (e) {
        appError('Purchase orders', extractErrorMessage(e, 'Failed to load'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [load],
  );

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/inventory/purchase-orders',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadMeta().catch((e) =>
      appError('Purchase orders', extractErrorMessage(e, 'Failed to load')),
    );
  }, [loadMeta]);

  useEffect(() => {
    void run(false);
  }, [run]);

  const submit = async () => {
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup || !warehouseId || (requiresDelivery && !expectedDeliveryDate.trim())) {
      appAlert('Purchase orders', requiresDelivery
        ? 'Supplier, warehouse, and expected delivery are required.'
        : 'Supplier and warehouse are required.');
      return;
    }
    const payload: PurchaseOrderCreate = {
      supplierId: sup.id,
      supplierName: sup.name,
      warehouseId,
      orderDate: orderDate.trim(),
      expectedDeliveryDate: requiresDelivery ? expectedDeliveryDate.trim() : undefined,
      status,
      notes: notes.trim() || undefined,
    };
    try {
      setSaving(true);
      await createPurchaseOrder(payload);
      setOpen(false);
      setNotes('');
      setOrderDate(new Date().toISOString().slice(0, 10));
      setExpectedDeliveryDate(defaultExpectedDate());
      setStatus(PurchaseOrderStatus.DRAFT);
      await run(false);
    } catch (e) {
      appError('Purchase orders', extractErrorMessage(e, 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const removePo = (po: PurchaseOrder) => {
    appConfirm({
      title: 'Delete purchase order',
      message: po.orderNumber,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deletePurchaseOrder(po.id);
          await run(false);
        } catch (e) {
          appError('Purchase orders', extractErrorMessage(e, 'Failed to delete'));
        }
      },
    });
  };

  return (
    <WorkshopChrome
      title="Purchase orders"
      subtitle="Supplier orders & procurement"
      right={canManageInventory() ? <WorkshopHeaderButton onPress={() => setOpen(true)} /> : <View style={{ width: 72 }} />}
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void run(true)}
              tintColor={WS.primary}
            />
          }
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="clipboard-outline"
              title="No purchase orders"
              subtitle="Create purchase orders to restock from suppliers."
              actionLabel={canManageInventory() ? 'New order' : undefined}
              onAction={canManageInventory() ? () => setOpen(true) : undefined}
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="clipboard"
              iconColor="#7c3aed"
              iconBg="#f5f3ff"
              title={item.orderNumber}
              subtitle={item.supplierName}
              meta={formatUsd(item.totalAmount)}
              badges={[{ label: item.status, tone: 'status' }]}
              actions={
                canManageInventory()
                  ? [{ icon: 'trash-outline', onPress: () => removePo(item), danger: true }]
                  : undefined
              }
            />
          )}
        />
      )}

      <WorkshopFormSheet
        visible={open}
        title="New purchase order"
        onClose={() => setOpen(false)}
        footer={
          <>
            <WorkshopPrimaryButton
              label={saving ? 'Creating…' : 'Create order'}
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
        <OptionChips
          label="Supplier"
          options={suppliers.map((s) => ({ id: s.id, label: s.name }))}
          value={supplierId}
          onChange={setSupplierId}
        />
        <OptionChips
          label="Warehouse"
          options={warehouses.map((w) => ({ id: w.id, label: w.name }))}
          value={warehouseId}
          onChange={setWarehouseId}
        />
        <OptionChips
          label="Status"
          options={[
            { id: PurchaseOrderStatus.DRAFT, label: 'Draft' },
            { id: PurchaseOrderStatus.ORDERED, label: 'Ordered' },
            { id: PurchaseOrderStatus.ARRIVED, label: 'Arrived' },
            { id: PurchaseOrderStatus.CANCELLED, label: 'Cancelled' },
          ]}
          value={status}
          onChange={(id) => {
            setStatus(id as PurchaseOrderStatus);
            const nextRequiresDelivery =
              id !== PurchaseOrderStatus.ARRIVED && id !== PurchaseOrderStatus.CANCELLED;
            if (!nextRequiresDelivery) setExpectedDeliveryDate('');
          }}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="Order date" value={orderDate} onChange={setOrderDate} />
          </View>
          {requiresDelivery && (
            <View style={{ flex: 1 }}>
              <WorkshopDatePickerField label="Expected delivery" value={expectedDeliveryDate} onChange={setExpectedDeliveryDate} />
            </View>
          )}
        </View>
        <WorkshopFieldLabel>Notes</WorkshopFieldLabel>
        <WorkshopTextInput value={notes} onChangeText={setNotes} multiline style={{ minHeight: 64 }} />
      </WorkshopFormSheet>
    </WorkshopChrome>
  );
}
