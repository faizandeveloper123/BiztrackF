import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appError } from '../../../utils/appDialog';
import {
  getSupplierReturns,
  createSupplierReturn,
  getWarehouses,
  fetchPosProducts,
} from '../../../services/inventory/inventoryMobileApi';
import type { Warehouse, StockMovement } from '../../../models/inventory';
import { StockMovementType, StockMovementCreate } from '../../../models/inventory';
import type { Product } from '../../../models/pos';
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
  WorkshopPickerField,
  WorkshopFilterBar,
  countActiveFilters,
  WorkshopSearchBar,
  WS,
} from '../../workshop/components/WorkshopChrome';

function WarehouseChips(props: {
  warehouses: Warehouse[];
  value?: string;
  onChange: (id: string | undefined) => void;
  includeAll?: boolean;
}) {
  return (
    <>
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
          {props.includeAll ? (
            <Pressable
              onPress={() => props.onChange(undefined)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: !props.value ? WS.primary : '#f1f5f9',
                borderWidth: 1,
                borderColor: !props.value ? WS.primary : WS.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: !props.value ? '#fff' : '#475569' }}>
                All
              </Text>
            </Pressable>
          ) : null}
          {props.warehouses.map((w) => {
            const active = props.value === w.id;
            return (
              <Pressable
                key={w.id}
                onPress={() => props.onChange(w.id)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: active ? WS.primary : '#f1f5f9',
                  borderWidth: 1,
                  borderColor: active ? WS.primary : WS.border,
                  maxWidth: 200,
                }}
              >
                <Text
                  style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : '#475569' }}
                  numberOfLines={1}
                >
                  {w.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </>
  );
}

export function MobileSupplierReturnsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageInventory } = usePermissions();
  const [rows, setRows] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [filterWhId, setFilterWhId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productQ, setProductQ] = useState('');
  const [productPicker, setProductPicker] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [productLabel, setProductLabel] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  const loadMeta = useCallback(async () => {
    const [whRes, prRes] = await Promise.all([getWarehouses(), fetchPosProducts()]);
    setWarehouses(whRes.warehouses ?? []);
    setProducts(prRes.products ?? []);
    setWarehouseId((prev) => prev || whRes.warehouses?.[0]?.id || '');
  }, []);

  const load = useCallback(async () => {
    const res = await getSupplierReturns(filterWhId);
    setRows(res.stockMovements ?? []);
  }, [filterWhId]);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch (e) {
        appError('Supplier returns', extractErrorMessage(e, 'Failed to load'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [load],
  );

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/inventory/supplier-returns',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadMeta().catch((e) =>
      appError('Supplier returns', extractErrorMessage(e, 'Failed to load')),
    );
  }, [loadMeta]);

  useEffect(() => {
    void run(false);
  }, [run]);

  const filteredProducts = useMemo(() => {
    const t = productQ.trim().toLowerCase();
    if (!t) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t),
    );
  }, [products, productQ]);

  const pickProduct = (p: Product) => {
    setProductId(p.id);
    setProductLabel(`${p.name} (${p.sku})`);
    setProductPicker(false);
    setProductQ('');
  };

  const submit = async () => {
    if (!productId || !warehouseId) {
      appAlert('Supplier returns', 'Select product and warehouse.');
      return;
    }
    const q = parseFloat(quantity);
    const c = parseFloat(unitCost);
    if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(c) || c < 0) {
      appAlert('Supplier returns', 'Enter valid quantity and unit cost.');
      return;
    }
    const payload: StockMovementCreate = {
      productId,
      warehouseId,
      movementType: StockMovementType.RETURN,
      quantity: q,
      unitCost: c,
      notes: notes.trim() || undefined,
      referenceNumber: referenceNumber.trim() || undefined,
    };
    try {
      setSaving(true);
      await createSupplierReturn(payload);
      setOpen(false);
      setQuantity('');
      setUnitCost('');
      setNotes('');
      setReferenceNumber('');
      setProductId('');
      setProductLabel('');
      await run(false);
    } catch (e) {
      appError('Supplier returns', extractErrorMessage(e, 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkshopChrome
      title="Supplier returns"
      subtitle="Goods returned to suppliers"
      right={canManageInventory() ? <WorkshopHeaderButton onPress={() => setOpen(true)} /> : <View style={{ width: 72 }} />}
      scroll={false}
    >
      <WorkshopFilterBar
        resultCount={rows.length}
        activeFilterCount={countActiveFilters([filterWhId ?? ''])}
        onResetFilters={() => setFilterWhId(undefined)}
      >
        <WarehouseChips warehouses={warehouses} value={filterWhId} onChange={setFilterWhId} includeAll />
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
              icon="return-up-forward-outline"
              title="No supplier returns"
              subtitle="Record products sent back to suppliers."
              actionLabel={canManageInventory() ? 'Add return' : undefined}
              onAction={canManageInventory() ? () => setOpen(true) : undefined}
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="return-up-forward"
              iconColor="#2563eb"
              iconBg="#eff6ff"
              title={item.productName ?? 'Product'}
              subtitle={item.productSku}
              meta={`Qty ${item.quantity} · $${item.unitCost}`}
              badges={item.referenceNumber ? [{ label: `Ref ${item.referenceNumber}` }] : []}
            />
          )}
        />
      )}

      <WorkshopFormSheet
        visible={open}
        title="New supplier return"
        onClose={() => setOpen(false)}
        footer={
          <>
            <WorkshopPrimaryButton
              label={saving ? 'Saving…' : 'Save return'}
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
        <WarehouseChips warehouses={warehouses} value={warehouseId} onChange={(id) => id && setWarehouseId(id)} />
        <WorkshopPickerField
          label="Product"
          value={productLabel}
          placeholder="Tap to select"
          onPress={() => setProductPicker(true)}
        />
        <WorkshopFieldLabel>Quantity</WorkshopFieldLabel>
        <WorkshopTextInput value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />
        <WorkshopFieldLabel>Unit cost</WorkshopFieldLabel>
        <WorkshopTextInput value={unitCost} onChangeText={setUnitCost} keyboardType="decimal-pad" />
        <WorkshopFieldLabel>Reference (optional)</WorkshopFieldLabel>
        <WorkshopTextInput value={referenceNumber} onChangeText={setReferenceNumber} />
        <WorkshopFieldLabel>Notes</WorkshopFieldLabel>
        <WorkshopTextInput value={notes} onChangeText={setNotes} multiline style={{ minHeight: 72 }} />
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={productPicker}
        title="Select product"
        onClose={() => setProductPicker(false)}
        footer={
          <Pressable
            onPress={() => setProductPicker(false)}
            style={{ alignItems: 'center', paddingVertical: 10 }}
          >
            <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Close</Text>
          </Pressable>
        }
      >
        <WorkshopSearchBar value={productQ} onChangeText={setProductQ} placeholder="Search products…" />
        <FlatList
          data={filteredProducts}
          keyExtractor={(p) => p.id}
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: 320 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => pickProduct(item)}
              style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
            >
              <Text style={{ fontWeight: '600', color: WS.text }}>{item.name}</Text>
              <Text style={{ fontSize: 13, color: WS.textMuted, marginTop: 2 }}>{item.sku}</Text>
            </Pressable>
          )}
        />
      </WorkshopFormSheet>
    </WorkshopChrome>
  );
}
