import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import {
  WorkshopChrome,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopLoading,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopDatePickerField,
  WorkshopPrimaryButton,
  WS,
} from '../../workshop/components/WorkshopChrome';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appError } from '../../../utils/appDialog';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import type { Installment, InstallmentPlan } from '../../../models/sales';
import { PaymentMethod } from '../../../models/sales';
import {
  getAllInstallmentPlans,
  getInstallmentPlan,
  createPayment,
  applyPaymentToInstallment,
} from '../../../services/sales/invoiceMobileApi';
import { sharePdfFromAuthenticatedPath } from '../../../utils/salesPdfShare';
import { usePermissions } from '../../../hooks/usePermissions';

export function MobileInstallmentsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageSales } = usePermissions();

  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<InstallmentPlan | null>(null);

  const [payOpen, setPayOpen] = useState(false);
  const [payInst, setPayInst] = useState<Installment | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<string>(PaymentMethod.CASH);
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllInstallmentPlans(0, 200);
      setPlans(Array.isArray(data) ? data : []);
    } catch (e) {
      appError('Installments', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/sales/installments',
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

  const openDetail = async (p: InstallmentPlan) => {
    try {
      const full = await getInstallmentPlan(p.id);
      setSelected(full);
      setDetailOpen(true);
    } catch (e) {
      appError('Installments', extractErrorMessage(e, 'Failed to open'));
    }
  };

  const openPay = (inst: Installment) => {
    setPayInst(inst);
    const remaining = inst.amount - (inst.paid_amount || 0);
    setPayAmount(remaining > 0 ? String(remaining) : '');
    setPayMethod(PaymentMethod.CASH);
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayOpen(true);
  };

  const submitPay = async () => {
    if (!selected || !payInst) return;
    const amount = parseFloat(payAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      appAlert('Installments', 'Enter a valid amount');
      return;
    }
    try {
      const payment = await createPayment(selected.invoice_id, {
        invoiceId: selected.invoice_id,
        amount,
        paymentMethod: payMethod as PaymentMethod,
        paymentDate: payDate + 'T12:00:00.000Z',
      });
      await applyPaymentToInstallment(selected.id, payInst.id, {
        amount,
        payment_id: payment.id,
      });
      setPayOpen(false);
      setPayInst(null);
      const updated = await getInstallmentPlan(selected.id);
      setSelected(updated);
      await load();
    } catch (e) {
      appError('Installments', extractErrorMessage(e, 'Payment failed'));
    }
  };

  const pdfPlan = async () => {
    if (!selected) return;
    try {
      await sharePdfFromAuthenticatedPath(
        `/installments/installment-plans/${selected.id}/customer-info-pdf`,
        `installment-${selected.id}.pdf`,
      );
    } catch (e) {
      appError('Installments', extractErrorMessage(e, 'PDF failed'));
    }
  };

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return d;
    }
  };

  return (
    <>
      <WorkshopChrome title="Installments" subtitle="Payment plans" scroll={false}>
        {loading && !refreshing ? (
          <WorkshopLoading />
        ) : (
          <FlatList
            data={plans}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WS.primary} />
            }
            contentContainerStyle={{ paddingBottom: 24 }}
            ListEmptyComponent={
              <WorkshopEmptyState
                icon="calendar-outline"
                title="No plans"
                subtitle="Installment plans appear when created from invoices."
              />
            }
            renderItem={({ item }) => (
              <WorkshopListCard
                icon="calendar"
                iconColor="#d97706"
                iconBg="#fffbeb"
                title={`${item.number_of_installments} × ${item.frequency}`}
                subtitle={`Invoice ${item.invoice_id.slice(0, 8)}…`}
                meta={`${formatUsd(item.total_amount)} ${item.currency}`}
                badges={[{ label: item.status, tone: 'status' }]}
                onPress={() => void openDetail(item)}
              />
            )}
          />
        )}
      </WorkshopChrome>

      <WorkshopFormSheet
        visible={detailOpen}
        title="Plan"
        onClose={() => setDetailOpen(false)}
        footer={
          <View style={{ gap: 8 }}>
            <WorkshopPrimaryButton label="Download PDF" onPress={() => void pdfPlan()} />
            <Pressable onPress={() => setDetailOpen(false)} style={{ alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Close</Text>
            </Pressable>
          </View>
        }
      >
        {selected ? (
          <>
            <Text style={{ fontSize: 18, fontWeight: '800', color: WS.text, marginBottom: 4 }}>
              {formatUsd(selected.total_amount)} · {selected.currency}
            </Text>
            <Text style={{ fontSize: 14, color: WS.textMuted, marginBottom: 16 }}>
              {selected.number_of_installments} payments · {selected.frequency}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: WS.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>
              Schedule
            </Text>
            {(selected.installments ?? []).map((inst) => (
              <View
                key={inst.id}
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: '#f1f5f9',
                  paddingVertical: 12,
                }}
              >
                <Text style={{ fontWeight: '600', color: WS.text }}>
                  #{inst.sequence_number} · {fmtDate(inst.due_date)}
                </Text>
                <Text style={{ fontSize: 14, color: WS.textMuted, marginTop: 4 }}>
                  {formatUsd(inst.amount)} · {inst.status}
                  {inst.paid_amount ? ` · paid ${formatUsd(inst.paid_amount)}` : ''}
                </Text>
                {canManageSales() && inst.status !== 'paid' ? (
                  <Pressable
                    onPress={() => openPay(inst)}
                    style={{
                      marginTop: 8,
                      alignSelf: 'flex-start',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      backgroundColor: WS.primary,
                    }}
                  >
                    <Text style={{ fontWeight: '700', fontSize: 13, color: '#fff' }}>Pay</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </>
        ) : null}
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={payOpen}
        title="Record payment"
        onClose={() => setPayOpen(false)}
        footer={
          <View style={{ gap: 8 }}>
            <WorkshopPrimaryButton label="Save" onPress={() => void submitPay()} />
            <Pressable onPress={() => setPayOpen(false)} style={{ alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </View>
        }
      >
        <WorkshopFieldLabel>Amount</WorkshopFieldLabel>
        <WorkshopTextInput
          value={payAmount}
          onChangeText={setPayAmount}
          keyboardType="decimal-pad"
          placeholder="Amount"
        />
        <WorkshopFieldLabel>Payment method</WorkshopFieldLabel>
        <WorkshopTextInput
          value={payMethod}
          onChangeText={setPayMethod}
          placeholder="cash, bank_transfer…"
        />
        <WorkshopDatePickerField label="Payment date" value={payDate} onChange={setPayDate} />
      </WorkshopFormSheet>
    </>
  );
}
