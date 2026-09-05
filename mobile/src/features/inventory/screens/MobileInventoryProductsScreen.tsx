import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import type { Product, ProductCreate } from '../../../models/pos';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  createProduct,
  deleteProduct,
  fetchPosProducts,
  fetchProductCategories,
  lookupProductCode,
  updateProduct,
} from '../../../services/inventory/inventoryMobileApi';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import { ProductDetailSheet } from './products/ProductDetailSheet';
import { ProductFormModal } from './products/ProductFormModal';
import { ProductCodeScannerModal } from './products/ProductCodeScannerModal';
import { BLANK_PRODUCT_FORM, productToForm, type ProductFormState } from './products/types';
import {
  mergeLookupIntoForm,
  type ProductEntryMode,
} from './products/productCodeHelpers';
import {
  WorkshopChrome,
  WorkshopSearchBar,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopFAB,
  WS,
} from '../../workshop/components/WorkshopChrome';

type Props = {
  sidebarPathWhenNotDashboard?: string;
  title?: string;
  manageScope?: 'inventory' | 'pos';
};

export function MobileInventoryProductsScreen({
  sidebarPathWhenNotDashboard = '/inventory/products',
  title = 'Products',
  manageScope = 'inventory',
}: Props = {}) {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageInventory, hasPermission, isOwner } = usePermissions();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(BLANK_PRODUCT_FORM);
  const [saving, setSaving] = useState(false);
  const [entryMode, setEntryMode] = useState<ProductEntryMode>('manual');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'qr' | 'barcode'>('qr');
  const [lookupLoading, setLookupLoading] = useState(false);

  const canEdit =
    manageScope === 'pos'
      ? hasPermission('pos:products:create') ||
        hasPermission('pos:products:update') ||
        hasPermission('pos:create') ||
        isOwner()
      : canManageInventory();

  const load = useCallback(async () => {
    const res = await fetchPosProducts();
    setProducts(res.products ?? []);
    try {
      const catRes = await fetchProductCategories();
      setCategories(catRes.categories ?? []);
    } catch {
      setCategories([]);
    }
  }, []);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch {
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [load],
  );

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : sidebarPathWhenNotDashboard,
    );
  }, [setSidebarActivePath, workspacePath, sidebarPathWhenNotDashboard]);

  useEffect(() => {
    void run(false);
  }, [run]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(t) ||
        p.sku.toLowerCase().includes(t) ||
        p.category.toLowerCase().includes(t),
    );
  }, [products, q]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(BLANK_PRODUCT_FORM);
    setEntryMode('manual');
    setScannerOpen(false);
    setFormOpen(true);
  };

  const openEdit = (p: Product) => {
    setDetailOpen(false);
    setEditTarget(p);
    setForm(productToForm(p));
    setEntryMode('manual');
    setScannerOpen(false);
    setFormOpen(true);
  };

  const handleCodeScan = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setLookupLoading(true);
    try {
      const response = await lookupProductCode(trimmed);
      setForm((prev) => mergeLookupIntoForm(prev, response.suggested));
      setEntryMode('manual');
      setScannerOpen(false);
      appAlert('Products', response.message);
    } catch (e) {
      appError('Products', extractErrorMessage(e, 'Could not load product details from scanned code.'));
    } finally {
      setLookupLoading(false);
    }
  };

  const openScanner = (mode: 'qr' | 'barcode') => {
    setScannerMode(mode);
    setScannerOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim()) {
      appAlert('Products', 'Name and SKU are required.');
      return;
    }
    const payload: ProductCreate = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      description: form.description.trim() || undefined,
      salePrice: parseFloat(form.salePrice) || 0,
      costPerUnitPrice: parseFloat(form.costPerUnitPrice) || 0,
      stockQuantity: parseInt(form.stockQuantity, 10) || 0,
      minStockLevel: parseInt(form.minStockLevel, 10) || 0,
      category: form.category,
      unitOfMeasure: form.unitOfMeasure,
      barcode: form.barcode.trim() || undefined,
      expiryDate: form.expiryDate.trim() || undefined,
      batchNumber: form.batchNumber.trim() || undefined,
      serialNumber: form.serialNumber.trim() || undefined,
      mfgDate: form.mfgDate.trim() || undefined,
      dateOfPurchase: form.dateOfPurchase.trim() || undefined,
      modelNo: form.modelNo.trim() || undefined,
    };
    try {
      setSaving(true);
      if (editTarget) {
        await updateProduct(editTarget.id, payload);
      } else {
        await createProduct(payload);
      }
      setFormOpen(false);
      await run(false);
    } catch (e) {
      appError('Products', extractErrorMessage(e, 'Failed to save product'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (p: Product) => {
    appConfirm({
      title: 'Delete product',
      message: `Delete "${p.name}"?`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteProduct(p.id);
          setDetailOpen(false);
          setDetail(null);
          await run(false);
        } catch (e) {
          appError('Products', extractErrorMessage(e, 'Failed to delete'));
        }
      },
    });
  };

  const setField = <K extends keyof ProductFormState>(k: K, v: ProductFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const stockBadge = (p: Product) => {
    if (p.stockQuantity <= 0) return [{ label: 'Out of stock', tone: 'priority' as const }];
    if (p.stockQuantity <= p.minStockLevel) return [{ label: 'Low stock', tone: 'priority' as const }];
    return [{ label: p.category, tone: 'status' as const }];
  };

  return (
    <WorkshopChrome
      title={title}
      subtitle="Catalog, pricing & stock levels"
      right={canEdit ? <WorkshopHeaderButton onPress={openCreate} /> : <View style={{ width: 72 }} />}
      scroll={false}
    >
      <WorkshopSearchBar
        value={q}
        onChangeText={setQ}
        placeholder="Search name, SKU or category…"
      />

      {loading && !refreshing ? (
        <WorkshopLoading />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void run(true)}
              tintColor={WS.primary}
            />
          }
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="cube-outline"
              title="No products found"
              subtitle="Add products to your inventory catalog."
              actionLabel={canEdit ? 'Create product' : undefined}
              onAction={canEdit ? openCreate : undefined}
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="cube"
              iconColor="#d97706"
              iconBg="#fffbeb"
              title={item.name}
              subtitle={`SKU ${item.sku}`}
              meta={`${formatUsd(item.salePrice)} · Stock ${item.stockQuantity}`}
              badges={stockBadge(item)}
              onPress={() => {
                setDetail(item);
                setDetailOpen(true);
              }}
              actions={
                canEdit
                  ? [
                      { icon: 'eye-outline', onPress: () => { setDetail(item); setDetailOpen(true); } },
                      { icon: 'create-outline', onPress: () => openEdit(item) },
                    ]
                  : [{ icon: 'eye-outline', onPress: () => { setDetail(item); setDetailOpen(true); } }]
              }
            />
          )}
        />
      )}

      {canEdit ? <WorkshopFAB onPress={openCreate} /> : null}

      <ProductDetailSheet
        visible={detailOpen}
        detail={detail}
        canEdit={canEdit}
        onClose={() => setDetailOpen(false)}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
      <ProductFormModal
        visible={formOpen}
        editMode={Boolean(editTarget)}
        saving={saving}
        lookupLoading={lookupLoading}
        entryMode={entryMode}
        form={form}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSave={() => void handleSave()}
        onEntryModeChange={setEntryMode}
        onOpenScanner={openScanner}
        onFieldChange={setField}
      />
      <ProductCodeScannerModal
        visible={scannerOpen}
        mode={scannerMode}
        loading={lookupLoading}
        onClose={() => setScannerOpen(false)}
        onScan={(code) => void handleCodeScan(code)}
      />
    </WorkshopChrome>
  );
}
