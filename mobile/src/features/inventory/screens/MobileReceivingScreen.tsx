import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import {
  getReceivings,
  createReceiving,
  deleteReceiving,
  getPurchaseOrders,
  getWarehouses,
} from '../../../services/inventory/inventoryMobileApi';
import type {
  Warehouse,
  PurchaseOrder,
  Receiving,
  ReceivingCreate,
} from '../../../models/inventory';
import { PurchaseOrderStatus } from '../../../models/inventory';
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

const RECEIVING_ELIGIBLE_PO_STATUSES: string[] = [
  PurchaseOrderStatus.ORDERED,
  PurchaseOrderStatus.APPROVED,
];

function OptionChips(props: {
  label: string;
  options: { id: string; label: string; sub?: string }[];
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
                  maxWidth: 220,
                }}
              >
                <Text
                  style={{ fontSize: 13, fontWeight: '600', color: active ? WS.primaryDark : WS.text }}
                  numberOfLines={2}
                >
                  {opt.label}
                </Text>
                {opt.sub ? (
                  <Text style={{ fontSize: 11, color: WS.textMuted, marginTop: 2 }} numberOfLines={1}>
                    {opt.sub}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export function MobileReceivingScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageInventory } = usePermissions();
  const [rows, setRows] = useState<Receiving[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [draft, setDraft] = useState<ReceivingCreate>({
    receivingNumber: '',
    purchaseOrderId: '',
    warehouseId: '',
    receivedDate: new Date().toISOString().slice(0, 10),
    notes: '',
    items: [],
  });

  const load = useCallback(async () => {
    const [recRes, poRes, whRes] = await Promise.all([
      getReceivings(),
      getPurchaseOrders(),
      getWarehouses(),
    ]);
    setRows(recRes.receivings ?? []);
    setPurchaseOrders(poRes.purchaseOrders ?? []);
    setWarehouses(whRes.warehouses ?? []);
    setDraft((prev) => ({
      ...prev,
      warehouseId: prev.warehouseId || whRes.warehouses?.[0]?.id || '',
    }));
  }, []);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch (e) {
        appError('Receiving', extractErrorMessage(e, 'Failed to load'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [load],
  );

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/inventory/receiving',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void run(false);
  }, [run]);

  const eligiblePos = useMemo(
    () =>
      purchaseOrders.filter((p) =>
        RECEIVING_ELIGIBLE_PO_STATUSES.includes(
          String(p.status ?? '')
            .trim()
            .toLowerCase(),
        ),
      ),
    [purchaseOrders],
  );

  const poOrderLabel = useMemo(() => {
    const m: Record<string, string> = {};
    purchaseOrders.forEach((p) => {
      m[p.id] = p.orderNumber;
    });
    return m;
  }, [purchaseOrders]);

  const whName = useMemo(() => {
    const m: Record<string, string> = {};
    warehouses.forEach((w) => {
      m[w.id] = w.name;
    });
    return m;
  }, [warehouses]);

  const onSelectPo = (po: PurchaseOrder) => {
    setSelectedPo(po);
    setDraft((prev) => ({
      ...prev,
      purchaseOrderId: po.id,
      warehouseId: po.warehouseId || prev.warehouseId,
      items: [],
    }));
  };

  const setReceivedQty = (index: number, qty: number) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((it, i) =>
        i === index ? { ...it, receivedQuantity: qty } : it,
      ),
    }));
  };

  const submit = async () => {
    if (!draft.purchaseOrderId || !draft.warehouseId || !draft.receivedDate) {
      appAlert('Receiving', 'Select PO, warehouse, and received date.');
      return;
    }
    if (draft.items.length > 0) {
      const bad = draft.items.filter(
        (it) => it.receivedQuantity < 0 || it.receivedQuantity > it.quantity,
      );
      if (bad.length > 0) {
        appAlert('Receiving', 'Received quantity must be between 0 and ordered quantity.');
        return;
      }
    }
    try {
      setSaving(true);
      await createReceiving(draft);
      setOpen(false);
      setSelectedPo(null);
      setDraft({
        receivingNumber: '',
        purchaseOrderId: '',
        warehouseId: warehouses[0]?.id ?? '',
        receivedDate: new Date().toISOString().slice(0, 10),
        notes: '',
        items: [],
      });
      await run(false);
    } catch (e) {
      appError('Receiving', extractErrorMessage(e, 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const removeRec = (r: Receiving) => {
    appConfirm({
      title: 'Delete receiving',
      message: r.receivingNumber,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteReceiving(r.id);
          await run(false);
        } catch (e) {
          appError('Receiving', extractErrorMessage(e, 'Failed to delete'));
        }
      },
    });
  };

  return (
    <WorkshopChrome
      title="Receiving"
      subtitle="Goods in & PO fulfillment"
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
              icon="checkmark-done-outline"
              title="No receivings"
              subtitle="Process incoming goods against purchase orders."
              actionLabel={canManageInventory() ? 'Process receiving' : undefined}
              onAction={canManageInventory() ? () => setOpen(true) : undefined}
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="checkmark-done"
              iconColor="#059669"
              iconBg="#ecfdf5"
              title={item.receivingNumber}
              subtitle={`PO ${poOrderLabel[item.purchaseOrderId] ?? item.purchaseOrderId}`}
              meta={whName[item.warehouseId] ?? item.warehouseId}
              badges={[{ label: item.status, tone: 'status' }]}
              actions={
                canManageInventory()
                  ? [{ icon: 'trash-outline', onPress: () => removeRec(item), danger: true }]
                  : undefined
              }
            />
          )}
        />
      )}

      <WorkshopFormSheet
        visible={open}
        title="Process receiving"
        onClose={() => {
          setOpen(false);
          setSelectedPo(null);
        }}
        footer={
          <>
            <WorkshopPrimaryButton
              label={saving ? 'Saving…' : 'Save receiving'}
              onPress={() => void submit()}
              disabled={saving}
            />
            <Pressable
              onPress={() => {
                setOpen(false);
                setSelectedPo(null);
              }}
              style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}
            >
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        {eligiblePos.length > 0 ? (
          <OptionChips
            label="Purchase order"
            options={eligiblePos.map((po) => ({
              id: po.id,
              label: po.orderNumber,
              sub: po.supplierName,
            }))}
            value={draft.purchaseOrderId}
            onChange={(id) => {
              const po = eligiblePos.find((p) => p.id === id);
              if (po) onSelectPo(po);
            }}
          />
        ) : (
          <Text style={{ color: WS.textMuted, marginBottom: 12 }}>
            No approved or ordered purchase orders available.
          </Text>
        )}

        <OptionChips
          label="Warehouse"
          options={warehouses.map((w) => ({ id: w.id, label: w.name }))}
          value={draft.warehouseId}
          onChange={(id) => setDraft((prev) => ({ ...prev, warehouseId: id }))}
        />

        <WorkshopDatePickerField label="Received date" value={draft.receivedDate} onChange={(v) => setDraft((prev) => ({ ...prev, receivedDate: v }))} />
        <WorkshopFieldLabel>Notes</WorkshopFieldLabel>
        <WorkshopTextInput
          value={draft.notes ?? ''}
          onChangeText={(v) => setDraft((prev) => ({ ...prev, notes: v }))}
          multiline
          style={{ minHeight: 64 }}
        />

        {selectedPo && draft.items.length > 0 ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: WS.text, marginBottom: 8 }}>
              Lines ({selectedPo.orderNumber})
            </Text>
            {draft.items.map((it, index) => (
              <View
                key={`${it.productId}-${index}`}
                style={{
                  marginBottom: 10,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: '#f8fafc',
                  borderWidth: 1,
                  borderColor: WS.border,
                }}
              >
                <Text style={{ fontWeight: '600', color: WS.text }}>{it.productName}</Text>
                <Text style={{ fontSize: 12, color: WS.textMuted, marginTop: 2 }}>{it.sku}</Text>
                <Text style={{ fontSize: 13, color: WS.text, marginTop: 6 }}>
                  Ordered {it.quantity}
                </Text>
                <WorkshopFieldLabel>Received qty</WorkshopFieldLabel>
                <WorkshopTextInput
                  value={String(it.receivedQuantity)}
                  onChangeText={(t) => setReceivedQty(index, parseInt(t, 10) || 0)}
                  keyboardType="number-pad"
                />
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ color: WS.textMuted, marginTop: 8 }}>
            Select a purchase order with open status.
          </Text>
        )}
      </WorkshopFormSheet>
    </WorkshopChrome>
  );
}
