import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { MobileFormSheet } from '../../../components/layout/MobileForm';
import {
  WorkshopChrome,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WS,
} from '../../workshop/components/WorkshopChrome';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appError } from '../../../utils/appDialog';
import { type DeliveryNote } from '../../../models/sales';
import {
  fetchInvoicesPaged,
  getDeliveryNotes,
  createDeliveryNote,
} from '../../../services/sales/invoiceMobileApi';
import type { Invoice } from '../../../models/sales';
import { sharePdfFromAuthenticatedPath } from '../../../utils/salesPdfShare';
import { usePermissions } from '../../../hooks/usePermissions';

export function MobileDeliveryNotesScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageSales } = usePermissions();

  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [invoiceHits, setInvoiceHits] = useState<Invoice[]>([]);
  const [invoiceId, setInvoiceId] = useState('');
  const [invoiceLabel, setInvoiceLabel] = useState('');
  const [noteText, setNoteText] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDeliveryNotes(undefined, 0, 200);
      setNotes(Array.isArray(data) ? data : []);
    } catch (e) {
      appError('Delivery notes', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/sales/delivery-notes',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      void (async () => {
        if (invoiceQuery.trim().length < 2) {
          setInvoiceHits([]);
          return;
        }
        try {
          const res = await fetchInvoicesPaged(
            { search: invoiceQuery.trim() },
            1,
            25,
          );
          setInvoiceHits(res.invoices ?? []);
        } catch {
          setInvoiceHits([]);
        }
      })();
    }, 400);
    return () => clearTimeout(t);
  }, [invoiceQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const submitCreate = async () => {
    if (!invoiceId) {
      appAlert('Delivery notes', 'Select an invoice');
      return;
    }
    try {
      await createDeliveryNote({
        invoice_id: invoiceId,
        note: noteText.trim() || null,
      });
      setCreateOpen(false);
      setInvoiceId('');
      setInvoiceLabel('');
      setNoteText('');
      setInvoiceQuery('');
      await load();
    } catch (e) {
      appError('Delivery notes', extractErrorMessage(e, 'Failed to create'));
    }
  };

  const pdf = async (n: DeliveryNote) => {
    try {
      await sharePdfFromAuthenticatedPath(
        `/delivery-notes/${n.id}/download`,
        `delivery-note-${n.id}.pdf`,
      );
    } catch (e) {
      appError('Delivery notes', extractErrorMessage(e, 'PDF failed'));
    }
  };

  const openCreate = () => {
    setInvoiceId('');
    setInvoiceLabel('');
    setNoteText('');
    setInvoiceQuery('');
    setCreateOpen(true);
  };

  return (
    <>
      <WorkshopChrome
        title="Delivery notes"
        subtitle="Shipment records"
        scroll={false}
        right={
          canManageSales() ? (
            <WorkshopHeaderButton onPress={openCreate} />
          ) : (
            <View style={{ width: 72 }} />
          )
        }
      >
        {loading && !refreshing ? (
          <WorkshopLoading />
        ) : (
          <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WS.primary} />
            }
            contentContainerStyle={{ paddingBottom: 24 }}
            ListEmptyComponent={
              <WorkshopEmptyState
                icon="cube-outline"
                title="No delivery notes"
                subtitle="Create a delivery note linked to an invoice."
                actionLabel={canManageSales() ? 'New note' : undefined}
                onAction={canManageSales() ? openCreate : undefined}
              />
            }
            renderItem={({ item }) => (
              <WorkshopListCard
                icon="cube"
                iconColor="#0891b2"
                iconBg="#ecfeff"
                title={item.invoice_number ?? item.invoice_id.slice(0, 8)}
                subtitle={item.customer_name ?? undefined}
                meta={item.note ?? undefined}
                actions={[{ icon: 'document-outline', label: 'PDF', onPress: () => void pdf(item) }]}
              />
            )}
          />
        )}
      </WorkshopChrome>

      <MobileFormSheet
        visible={createOpen}
        title="New Delivery Note"
        onCancel={() => setCreateOpen(false)}
        onSave={() => void submitCreate()}
      >
        <WorkshopFieldLabel>Invoice</WorkshopFieldLabel>
        <WorkshopTextInput
          value={invoiceQuery}
          onChangeText={setInvoiceQuery}
          placeholder="Search invoice # or customer…"
        />
        {invoiceLabel ? (
          <Text style={{ fontSize: 14, color: WS.text, marginBottom: 10 }}>
            Selected: {invoiceLabel}
          </Text>
        ) : null}
        {invoiceHits.length > 0 ? (
          <View
            style={{
              marginBottom: 12,
              maxHeight: 192,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: WS.border,
              backgroundColor: WS.card,
              overflow: 'hidden',
            }}
          >
            <FlatList
              data={invoiceHits}
              keyExtractor={(i) => i.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setInvoiceId(item.id);
                    setInvoiceLabel(`${item.invoiceNumber} · ${item.customerName}`);
                    setInvoiceHits([]);
                    setInvoiceQuery('');
                  }}
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: '#f1f5f9',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{ fontWeight: '600', color: WS.text }}>{item.invoiceNumber}</Text>
                  <Text style={{ fontSize: 13, color: WS.textMuted }}>{item.customerName}</Text>
                </Pressable>
              )}
            />
          </View>
        ) : null}
        <WorkshopFieldLabel>Note</WorkshopFieldLabel>
        <WorkshopTextInput
          value={noteText}
          onChangeText={setNoteText}
          multiline
          placeholder="Optional note"
          style={{ minHeight: 120 }}
        />
      </MobileFormSheet>
    </>
  );
}
