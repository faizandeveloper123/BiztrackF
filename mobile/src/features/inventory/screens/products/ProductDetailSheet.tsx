import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { formatUsd } from '../../../../services/crm/CrmMobileService';
import type { Product } from '../../../../models/pos';
import { stockColor } from './helpers';
import { AppModal } from '../../../../components/layout/AppModal';
import { KeyboardBottomSheetShell } from '../../../../components/layout/KeyboardBottomSheetShell';

type Props = {
  visible: boolean;
  detail: Product | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

export function ProductDetailSheet({
  visible,
  detail,
  canEdit,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  return (
    <AppModal
      visible={visible}
      animationType="slide"
      transparent
      onClose={onClose}
    >
      <KeyboardBottomSheetShell overlayColor="rgba(0,0,0,0.45)">
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' }}>
          <View style={{ alignItems: 'center', paddingTop: 12 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0' }} />
          </View>
          {detail && (
            <ScrollView style={{ paddingHorizontal: 20, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: 32 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a' }}>{detail.name}</Text>
                  <Text style={{ color: '#64748b', fontSize: 13 }}>SKU: {detail.sku}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: '#1d4ed8' }}>{formatUsd(detail.salePrice)}</Text>
                </View>
              </View>

              {detail.description ? (
                <Text style={{ marginTop: 10, color: '#475569', lineHeight: 20 }}>{detail.description}</Text>
              ) : null}

              <View style={{ marginTop: 16, backgroundColor: '#f8fafc', borderRadius: 14, padding: 14 }}>
                {[
                  { label: 'Cost Per Unit Price', value: formatUsd(detail.costPerUnitPrice) },
                  { label: 'Stock', value: String(detail.stockQuantity), color: stockColor(detail.stockQuantity, detail.minStockLevel) },
                  { label: 'Min Stock', value: String(detail.minStockLevel) },
                  { label: 'Category', value: detail.category },
                  { label: 'Unit', value: detail.unitOfMeasure },
                  ...(detail.barcode ? [{ label: 'Barcode', value: detail.barcode }] : []),
                  ...(detail.batchNumber ? [{ label: 'Batch Number', value: detail.batchNumber }] : []),
                  ...(detail.serialNumber ? [{ label: 'Serial Number', value: detail.serialNumber }] : []),
                  ...(detail.modelNo ? [{ label: 'Model No.', value: detail.modelNo }] : []),
                  ...(detail.expiryDate ? [{ label: 'Expiry Date', value: detail.expiryDate }] : []),
                  ...(detail.mfgDate ? [{ label: 'Mfg. Date', value: detail.mfgDate }] : []),
                  ...(detail.dateOfPurchase ? [{ label: 'Date of Purchase', value: detail.dateOfPurchase }] : []),
                ].map(({ label, value, color }) => (
                  <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                    <Text style={{ color: '#64748b', fontSize: 14 }}>{label}</Text>
                    <Text style={{ color: color ?? '#0f172a', fontSize: 14, fontWeight: '600', textTransform: 'capitalize' }}>{value}</Text>
                  </View>
                ))}
              </View>

              {canEdit && (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                  <Pressable
                    onPress={() => onEdit(detail)}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 13 }}
                  >
                    <Ionicons name="pencil" size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onDelete(detail)}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fef2f2', borderRadius: 12, paddingVertical: 13 }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                    <Text style={{ color: '#dc2626', fontWeight: '700', fontSize: 15 }}>Delete</Text>
                  </Pressable>
                </View>
              )}

              <Pressable
                onPress={onClose}
                style={{ marginTop: 12, alignItems: 'center', paddingVertical: 13, backgroundColor: '#f1f5f9', borderRadius: 12 }}
              >
                <Text style={{ color: '#475569', fontWeight: '600', fontSize: 15 }}>Close</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </KeyboardBottomSheetShell>
    </AppModal>
  );
}
