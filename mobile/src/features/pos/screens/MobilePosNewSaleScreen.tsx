import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { fetchPosProducts } from '../../../services/inventory/inventoryMobileApi';
import {
  getCurrentOpenShift,
  createPosTransaction,
} from '../../../services/pos/posMobileApi';
import type { Product, POSTransactionCreate, POSAPIPaymentMethod } from '../../../models/pos';
import type { POSShift } from '../../../models/pos';

type CartLine = { product: Product; quantity: number; total: number };

const PAYMENT_OPTIONS: { key: POSAPIPaymentMethod; label: string }[] = [
  { key: 'cash', label: 'Cash' },
  { key: 'credit_card', label: 'Credit Card' },
  { key: 'debit_card', label: 'Debit Card' },
  { key: 'bank_transfer', label: 'Bank Transfer' },
  { key: 'check', label: 'Check' },
  { key: 'other', label: 'Other' },
];

export function MobilePosNewSaleScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageSales, isOwner } = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payment, setPayment] = useState<POSAPIPaymentMethod>('cash');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openShift, setOpenShift] = useState<POSShift | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchPosProducts();
      setProducts(res.products ?? []);
    } catch (e) {
      Alert.alert('POS', extractErrorMessage(e, 'Failed to load products'));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshShift = useCallback(async () => {
    try {
      const r = await getCurrentOpenShift();
      setOpenShift(r.shift);
    } catch {
      setOpenShift(null);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/pos/sale',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadProducts();
    void refreshShift();
  }, [loadProducts, refreshShift]);

  const filtered = products.filter((p) => {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return (
      p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t)
    );
  });

  const addToCart = (product: Product) => {
    const existing = cart.find((c) => c.product.id === product.id);
    if (existing) {
      setCart(
        cart.map((c) =>
          c.product.id === product.id
            ? {
                ...c,
                quantity: c.quantity + 1,
                total: (c.quantity + 1) * product.salePrice,
              }
            : c,
        ),
      );
    } else {
      setCart([
        ...cart,
        { product, quantity: 1, total: product.salePrice },
      ]);
    }
  };

  const setQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((c) => c.filter((x) => x.product.id !== productId));
      return;
    }
    setCart((lines) =>
      lines.map((line) =>
        line.product.id === productId
          ? {
              ...line,
              quantity: qty,
              total: qty * line.product.salePrice,
            }
          : line,
      ),
    );
  };

  const subtotal = cart.reduce((s, l) => s + l.total, 0);

  const checkout = async () => {
    if (!openShift) {
      Alert.alert(
        'POS',
        'Open a shift from the POS dashboard before recording a sale.',
      );
      return;
    }
    if (!canManageSales() && !isOwner()) {
      Alert.alert('POS', 'You do not have permission to complete sales.');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('POS', 'Add items to the cart.');
      return;
    }
    const payload: POSTransactionCreate = {
      customerName: customerName.trim() || undefined,
      items: cart.map((line) => ({
        productId: line.product.id,
        productName: line.product.name,
        sku: line.product.sku,
        quantity: line.quantity,
        unitPrice: line.product.salePrice,
        discount: 0,
        taxRate: 0,
        taxAmount: 0,
        total: line.total,
      })),
      taxRate: 0,
      discount: 0,
      paymentMethod: payment,
      notes: notes.trim() || undefined,
    };
    setSubmitting(true);
    try {
      await createPosTransaction(payload);
      setCart([]);
      setCustomerName('');
      setNotes('');
      await refreshShift();
      Alert.alert('POS', 'Sale completed.');
    } catch (e) {
      Alert.alert('POS', extractErrorMessage(e, 'Sale failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          New sale
        </Text>
        <View className="w-10" />
      </View>

      {!openShift ? (
        <View className="border-b border-amber-200 bg-amber-50 px-3 py-2">
          <Text className="text-center text-amber-900">
            No open shift — open one from POS dashboard first.
          </Text>
        </View>
      ) : null}

      <View className="border-b border-slate-200 bg-white px-3 py-2">
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search products…"
          className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
        />
      </View>

      <View className="flex-1 flex-row">
        <View className="flex-1 border-r border-slate-200">
          {loading ? (
            <View className="flex-1 items-center justify-center py-8">
              <ActivityIndicator color="#2563eb" />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(p) => p.id}
              contentContainerStyle={{ padding: 8, paddingBottom: 24 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => addToCart(item)}
                  className="mb-2 rounded-lg border border-slate-200 bg-white p-3"
                >
                  <Text className="font-medium text-slate-900">{item.name}</Text>
                  <Text className="text-xs text-slate-500">{item.sku}</Text>
                  <Text className="mt-1 text-slate-800">
                    {formatUsd(item.salePrice)}
                  </Text>
                </Pressable>
              )}
            />
          )}
        </View>

        <View className="w-[48%] bg-white">
          <ScrollView className="flex-1 px-2 py-2">
            <Text className="font-semibold text-slate-900">Cart</Text>
            {cart.length === 0 ? (
              <Text className="mt-2 text-sm text-slate-500">Empty</Text>
            ) : (
              cart.map((line) => (
                <View
                  key={line.product.id}
                  className="mt-2 border-b border-slate-100 pb-2"
                >
                  <Text
                    className="text-sm font-medium text-slate-900"
                    numberOfLines={2}
                  >
                    {line.product.name}
                  </Text>
                  <View className="mt-1 flex-row items-center justify-between">
                    <TextInput
                      value={String(line.quantity)}
                      onChangeText={(t) =>
                        setQty(line.product.id, parseInt(t, 10) || 0)
                      }
                      keyboardType="number-pad"
                      className="w-14 rounded border border-slate-200 px-2 py-1 text-center text-slate-900"
                    />
                    <Text className="text-sm text-slate-800">
                      {formatUsd(line.total)}
                    </Text>
                  </View>
                </View>
              ))
            )}
            <Text className="mt-3 font-semibold text-slate-900">
              {formatUsd(subtotal)}
            </Text>

            <Text className="mb-1 mt-3 text-xs text-slate-600">Payment</Text>
            <View className="flex-row flex-wrap gap-1">
              {PAYMENT_OPTIONS.map((o) => (
                <Pressable
                  key={o.key}
                  onPress={() => setPayment(o.key)}
                  className={`rounded-lg border px-2 py-1 ${payment === o.key ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}
                >
                  <Text className="text-xs text-slate-800">{o.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text className="mb-1 mt-2 text-xs text-slate-600">Customer</Text>
            <TextInput
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Optional"
              className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-900"
            />
            <Text className="mb-1 mt-2 text-xs text-slate-600">Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional"
              multiline
              className="min-h-[48px] rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-900"
            />

            <Pressable
              onPress={() => void checkout()}
              disabled={submitting || cart.length === 0}
              className={`mt-4 items-center rounded-lg py-3 ${cart.length === 0 ? 'bg-slate-300' : 'bg-blue-600'}`}
            >
              <Text className="font-semibold text-white">
                {submitting ? '…' : 'Complete sale'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}
