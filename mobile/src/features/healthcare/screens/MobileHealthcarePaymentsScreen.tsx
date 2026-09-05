import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import type { AdmissionInvoiceSummary } from '../../../models/healthcare';
import { getAdmissionInvoices } from '../../../services/healthcare/healthcareMobileApi';
import { apiService } from '../../../services/ApiService';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { AppModal } from '../../../components/layout/AppModal';
import {
  HealthcareChrome,
  HealthcareCard,
  HealthcareFieldLabel,
  HealthcarePrimaryButton,
  HealthcareOutlineButton,
} from '../components/HealthcareChrome';
import { WorkshopDatePickerField } from '../../workshop/components/WorkshopChrome';
import { KeyboardBottomSheetShell } from '../../../components/layout/KeyboardBottomSheetShell';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'paypal', label: 'PayPal' },
] as const;

const PAGE_SIZE = 20;

function isInvoicePaymentCreatedByBug(error: unknown): boolean {
  const message = extractErrorMessage(error, '');
  return message.includes("'createdBy' is an invalid keyword argument for Payment");
}

export function MobileHealthcarePaymentsScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [list, setList] = useState<AdmissionInvoiceSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [inv, setInv] = useState<AdmissionInvoiceSummary | null>(null);
  const [amount, setAmount] = useState('');
  const [payDate, setPayDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [payBusy, setPayBusy] = useState(false);

  useEffect(() => {
    setSidebarActivePath('/healthcare/payments');
  }, [setSidebarActivePath]);

  const load = useCallback(async () => {
    const res = await getAdmissionInvoices({ page, limit: PAGE_SIZE });
    setList(res.invoices);
    setTotal(res.total);
  }, [page]);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch (e) {
        Alert.alert('Payments', extractErrorMessage(e, 'Failed to load'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [load],
  );

  useEffect(() => {
    void run(false);
  }, [run]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openPay = (row: AdmissionInvoiceSummary) => {
    setInv(row);
    setAmount(row.balance > 0 ? String(row.balance) : '');
    setPayDate(new Date().toISOString().slice(0, 10));
    setMethod('cash');
    setReference('');
    setNotes('');
    setPayOpen(true);
  };

  const submitPay = async () => {
    if (!inv) return;
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) {
      Alert.alert('Payment', 'Enter a valid amount');
      return;
    }
    if (n > inv.balance) {
      Alert.alert('Payment', 'Amount cannot exceed balance');
      return;
    }
    try {
      setPayBusy(true);
      await apiService.post(`/invoices/${inv.id}/payments`, {
        invoiceId: inv.id,
        amount: n,
        paymentMethod: method,
        paymentDate: payDate,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setPayOpen(false);
      Alert.alert('Payment', 'Recorded');
      await run(false);
    } catch (e) {
      if (isInvoicePaymentCreatedByBug(e) && n >= inv.balance) {
        try {
          await apiService.post(`/invoices/${inv.id}/mark-as-paid`);
          setPayOpen(false);
          Alert.alert('Payment', 'Recorded');
          await run(false);
          return;
        } catch {}
      }
      Alert.alert('Payment', extractErrorMessage(e, 'Failed'));
    } finally {
      setPayBusy(false);
    }
  };

  return (
    <HealthcareChrome
      title="Hospital payments"
      subtitle="Admission invoices"
      scroll={false}
    >
      {loading && !refreshing ? (
        <View className="py-12 items-center">
          <ActivityIndicator color="#0d9488" />
        </View>
      ) : (
        <FlatList
          className="flex-1"
          data={list}
          keyExtractor={(x) => x.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void run(true)}
              tintColor="#0d9488"
            />
          }
          renderItem={({ item: row }) => (
            <HealthcareCard>
              <Text className="font-semibold text-slate-900">
                {row.invoice_number}
              </Text>
              <Text className="text-sm text-slate-600">{row.customer_name}</Text>
              <Text className="text-xs text-slate-500">
                Total {row.total} · Paid {row.total_paid} · Balance{' '}
                {row.balance}
              </Text>
              <Text className="text-xs capitalize text-slate-500">
                {row.status}
              </Text>
              {row.balance > 0 ? (
                <Pressable
                  onPress={() => openPay(row)}
                  className="mt-2 self-start rounded-lg bg-teal-600 px-3 py-1.5"
                >
                  <Text className="text-xs font-semibold text-white">
                    Record payment
                  </Text>
                </Pressable>
              ) : null}
            </HealthcareCard>
          )}
        />
      )}

      <View className="flex-row items-center justify-between py-4">
        <HealthcareOutlineButton
          label="Prev"
          onPress={() => setPage((p) => Math.max(1, p - 1))}
        />
        <Text className="text-sm text-slate-600">
          Page {page} / {totalPages}
        </Text>
        <HealthcareOutlineButton
          label="Next"
          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      </View>

      <AppModal
        visible={payOpen}
        animationType="slide"
        transparent
        onClose={() => setPayOpen(false)}
      >
        <KeyboardBottomSheetShell overlayColor="rgba(0,0,0,0.4)">
          <View className="rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="mb-3 text-lg font-semibold">Record payment</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <HealthcareFieldLabel>Amount</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
              <WorkshopDatePickerField label="Date" value={payDate} onChange={setPayDate} />
              <HealthcareFieldLabel>Method</HealthcareFieldLabel>
              <View className="mb-3 flex-row flex-wrap gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <Pressable
                    key={m.value}
                    onPress={() => setMethod(m.value)}
                    className={`rounded-full px-3 py-1 ${method === m.value ? 'bg-teal-600' : 'bg-slate-100'}`}
                  >
                    <Text
                      className={`text-xs ${method === m.value ? 'text-white' : 'text-slate-700'}`}
                    >
                      {m.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <HealthcareFieldLabel>Reference</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2"
                value={reference}
                onChangeText={setReference}
              />
              <HealthcareFieldLabel>Notes</HealthcareFieldLabel>
              <TextInput
                className="mb-4 rounded-lg border border-slate-200 px-3 py-2"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </ScrollView>
            <HealthcarePrimaryButton
              label={payBusy ? 'Saving…' : 'Submit'}
              onPress={() => void submitPay()}
              disabled={payBusy}
            />
            <Pressable className="mt-2 items-center py-2" onPress={() => setPayOpen(false)}>
              <Text className="text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </KeyboardBottomSheetShell>
      </AppModal>
    </HealthcareChrome>
  );
}
