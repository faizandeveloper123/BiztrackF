import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UnitOfMeasure } from '../../../../models/pos';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from './helpers';
import type { ProductFormState } from './types';
import type { ProductEntryMode } from './productCodeHelpers';
import { ProductChipSelect } from './ProductChipSelect';
import { ProductFieldRow } from './ProductFieldRow';
import { ProductDatePickerField } from '../../../workshop/components/WorkshopChrome';
import { AppModal } from '../../../../components/layout/AppModal';

type Props = {
  visible: boolean;
  editMode: boolean;
  saving: boolean;
  lookupLoading: boolean;
  entryMode: ProductEntryMode;
  form: ProductFormState;
  categories?: string[];
  onClose: () => void;
  onSave: () => void;
  onEntryModeChange: (mode: ProductEntryMode) => void;
  onOpenScanner: (mode: Exclude<ProductEntryMode, 'manual'>) => void;
  onFieldChange: <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => void;
};

const ENTRY_MODES: { id: ProductEntryMode; label: string }[] = [
  { id: 'manual', label: 'Manual' },
  { id: 'qr', label: 'QR Scan' },
  { id: 'barcode', label: 'Barcode' },
];

export function ProductFormModal({
  visible,
  editMode,
  saving,
  lookupLoading,
  entryMode,
  form,
  categories,
  onClose,
  onSave,
  onEntryModeChange,
  onOpenScanner,
  onFieldChange,
}: Props) {
  const categoryOptions = categories && categories.length ? categories : PRODUCT_CATEGORIES;
  return (
    <AppModal visible={visible} animationType="slide" onClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 14 }}>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </Pressable>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#0f172a' }}>
              {editMode ? 'Edit Product' : 'New Product'}
            </Text>
            <Pressable
              onPress={onSave}
              disabled={saving || lookupLoading}
              style={{
                backgroundColor: saving || lookupLoading ? '#93c5fd' : '#2563eb',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Save</Text>
              )}
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {!editMode && (
              <>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  {ENTRY_MODES.map((mode) => {
                    const active = entryMode === mode.id;
                    return (
                      <Pressable
                        key={mode.id}
                        onPress={() => onEntryModeChange(mode.id)}
                        style={{
                          flex: 1,
                          borderRadius: 10,
                          paddingVertical: 10,
                          alignItems: 'center',
                          backgroundColor: active ? '#2563eb' : '#f1f5f9',
                        }}
                      >
                        <Text style={{ color: active ? '#fff' : '#475569', fontWeight: '700', fontSize: 13 }}>
                          {mode.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {entryMode !== 'manual' && (
                  <Pressable
                    onPress={() => onOpenScanner(entryMode)}
                    disabled={lookupLoading}
                    style={{
                      marginBottom: 16,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#bfdbfe',
                      backgroundColor: '#eff6ff',
                      padding: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <Ionicons name={entryMode === 'qr' ? 'qr-code-outline' : 'barcode-outline'} size={22} color="#2563eb" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#1d4ed8', fontWeight: '700' }}>
                        {entryMode === 'qr' ? 'Open QR Scanner' : 'Open Barcode Scanner'}
                      </Text>
                      <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                        Scan to auto-fill product details, then review before saving.
                      </Text>
                    </View>
                    {lookupLoading ? (
                      <ActivityIndicator size="small" color="#2563eb" />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color="#2563eb" />
                    )}
                  </Pressable>
                )}
              </>
            )}

            <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Basic Info
            </Text>
            <ProductFieldRow label="Product Name *" value={form.name} onChange={(v) => onFieldChange('name', v)} placeholder="e.g. Wireless Mouse" />
            <ProductFieldRow label="SKU *" value={form.sku} onChange={(v) => onFieldChange('sku', v)} placeholder="e.g. WL-MOUSE-001" />
            <ProductFieldRow label="Description" value={form.description} onChange={(v) => onFieldChange('description', v)} placeholder="Optional product description…" multiline />
            <ProductFieldRow label="Barcode" value={form.barcode} onChange={(v) => onFieldChange('barcode', v)} placeholder="Optional" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <ProductDatePickerField label="Expiry Date" value={form.expiryDate} onChange={(v) => onFieldChange('expiryDate', v)} />
              </View>
              <View style={{ flex: 1 }}>
                <ProductDatePickerField label="Mfg. Date" value={form.mfgDate} onChange={(v) => onFieldChange('mfgDate', v)} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <ProductDatePickerField label="Date of Purchase" value={form.dateOfPurchase} onChange={(v) => onFieldChange('dateOfPurchase', v)} />
              </View>
              <View style={{ flex: 1 }}>
                <ProductFieldRow label="Batch Number" value={form.batchNumber} onChange={(v) => onFieldChange('batchNumber', v)} placeholder="Optional" />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <ProductFieldRow label="Serial Number" value={form.serialNumber} onChange={(v) => onFieldChange('serialNumber', v)} placeholder="Optional" />
              </View>
              <View style={{ flex: 1 }}>
                <ProductFieldRow label="Model No." value={form.modelNo} onChange={(v) => onFieldChange('modelNo', v)} placeholder="Optional" />
              </View>
            </View>

            <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb', marginTop: 8, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Pricing
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <ProductFieldRow label="Sale Price" value={form.salePrice} onChange={(v) => onFieldChange('salePrice', v)} keyboardType="decimal-pad" placeholder="0.00" />
              </View>
              <View style={{ flex: 1 }}>
                <ProductFieldRow label="Cost Per Unit Price" value={form.costPerUnitPrice} onChange={(v) => onFieldChange('costPerUnitPrice', v)} keyboardType="decimal-pad" placeholder="0.00" />
              </View>
            </View>

            <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb', marginTop: 4, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Stock
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <ProductFieldRow label="Quantity" value={form.stockQuantity} onChange={(v) => onFieldChange('stockQuantity', v)} keyboardType="number-pad" placeholder="0" />
              </View>
              <View style={{ flex: 1 }}>
                <ProductFieldRow label="Min Level" value={form.minStockLevel} onChange={(v) => onFieldChange('minStockLevel', v)} keyboardType="number-pad" placeholder="0" />
              </View>
            </View>

            <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb', marginTop: 4, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Category
            </Text>
            <ProductChipSelect
              label=""
              options={categoryOptions}
              value={form.category}
              onChange={(v) => onFieldChange('category', v)}
            />

            <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb', marginTop: 8, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Unit of Measure
            </Text>
            <ProductChipSelect
              label=""
              options={PRODUCT_UNITS}
              value={form.unitOfMeasure}
              onChange={(v) => onFieldChange('unitOfMeasure', v as UnitOfMeasure)}
            />
          </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppModal>
  );
}
