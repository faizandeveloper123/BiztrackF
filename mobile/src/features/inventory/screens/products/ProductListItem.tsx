import { Pressable, Text, View } from 'react-native';
import { formatUsd } from '../../../../services/crm/CrmMobileService';
import type { Product } from '../../../../models/pos';
import { stockColor } from './helpers';

type Props = {
  item: Product;
  canEdit: boolean;
  onView: (item: Product) => void;
  onEdit: (item: Product) => void;
};

export function ProductListItem({ item, canEdit, onView, onEdit }: Props) {
  return (
    <Pressable
      onPress={() => onView(item)}
      style={{
        marginBottom: 10,
        borderRadius: 14,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 14,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ fontWeight: '700', fontSize: 15, color: '#0f172a' }}>{item.name}</Text>
          <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>SKU: {item.sku}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontWeight: '700', fontSize: 15, color: '#1d4ed8' }}>{formatUsd(item.salePrice)}</Text>
          <Text style={{ fontSize: 11, color: '#94a3b8' }}>cost {formatUsd(item.costPerUnitPrice)}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: stockColor(item.stockQuantity, item.minStockLevel) }} />
          <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600' }}>Stock {item.stockQuantity}</Text>
        </View>
        <View style={{ backgroundColor: '#eff6ff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: '600', textTransform: 'capitalize' }}>{item.category}</Text>
        </View>
      </View>
      <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable
          onPress={() => onView(item)}
          style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
        >
          <Text style={{ color: '#334155', fontSize: 12, fontWeight: '600' }}>View</Text>
        </Pressable>
        {canEdit && (
          <Pressable
            onPress={() => onEdit(item)}
            style={{ backgroundColor: '#2563eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Edit</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
