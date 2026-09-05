import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, RefreshControl, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import {
  InvoiceStatus,
  type Invoice,
  type InvoiceCreate,
  type InvoiceItemCreate,
  type InvoiceDashboard,
  type InvoiceFilters,
  type InvoiceCustomerOption,
} from '../../../models/sales';
import {
  fetchInvoicesPaged,
  getInvoice,
  createInvoice,
  createInstallmentPlan as createInstallmentPlanApi,
  deleteInvoice,
  getInvoiceDashboard,
  searchInvoiceCustomers,
  markInvoicePaid,
  sendInvoiceEmail,
  sendInvoiceWhatsApp,
  fetchInvoiceProducts,
} from '../../../services/sales/invoiceMobileApi';
import { sharePdfFromAuthenticatedPath } from '../../../utils/salesPdfShare';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import { usePermissions } from '../../../hooks/usePermissions';
import type { Product } from '../../../models/pos';
import {
  WorkshopChrome,
  WorkshopChipSelect,
  WorkshopFilterBar,
  countActiveFilters,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopSegmentTabs,
  WorkshopStatCard,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopDatePickerField,
  WorkshopPickerField,
  WorkshopDetailRow,
  WorkshopBadge,
  WorkshopPrimaryButton,
  WorkshopOutlineButton,
  WS,
} from '../../workshop/components/WorkshopChrome';

const PAGE_SIZE = 15;
const STATUS_OPTS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  ...Object.values(InvoiceStatus).map((s) => ({
    value: s,
    label: s.replace(/_/g, ' '),
  })),
];

function customerLabel(c: InvoiceCustomerOption): string {
  const n = [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
  return n || c.customerId || c.id;
}

function buildItemsPayload(rows: InvoiceItemCreate[]): InvoiceItemCreate[] {
  return rows
    .filter((r) => r.description.trim().length > 0)
    .map((r) => ({
      description: r.description.trim(),
      quantity: Math.max(1, r.quantity || 1),
      salePrice: Number(r.salePrice) || 0,
      discount: Number(r.discount) || 0,
      taxRate: Number(r.taxRate) || 0,
      productId: r.productId || undefined,
    }));
}

function invoiceStatusIcon(status: string): 'checkmark-circle' | 'warning' | 'paper-plane' | 'pie-chart' | 'document' | 'help-circle' {
  const s = String(status).toLowerCase();
  if (s === 'paid') return 'checkmark-circle';
  if (s === 'overdue') return 'warning';
  if (s === 'sent') return 'paper-plane';
  if (s === 'partially_paid') return 'pie-chart';
  if (s === 'draft') return 'document';
  return 'help-circle';
}

function invoiceStatusColor(status: string): { icon: string; bg: string } {
  const s = String(status).toLowerCase();
  if (s === 'paid') return { icon: '#059669', bg: '#ecfdf5' };
  if (s === 'overdue') return { icon: '#e11d48', bg: '#fef2f2' };
  if (s === 'sent') return { icon: '#2563eb', bg: '#eff6ff' };
  if (s === 'partially_paid') return { icon: '#d97706', bg: '#fffbeb' };
  if (s === 'draft') return { icon: '#475569', bg: '#f1f5f9' };
  return { icon: '#475569', bg: '#f1f5f9' };
}

export function MobileInvoicesScreen() {
  const { workspacePath, setSidebarActivePath, setWorkspacePath } = useSidebarDrawer();
  const { canManageSales, canManageInvoices } = usePermissions();

  const [tab, setTab] = useState<'list' | 'dashboard'>('list');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dashboard, setDashboard] = useState<InvoiceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [saving, setSaving] = useState(false);

  const [custQuery, setCustQuery] = useState('');
  const [custHits, setCustHits] = useState<InvoiceCustomerOption[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [labourCost, setLabourCost] = useState('0');
  const [terms, setTerms] = useState('');
  const [lineRows, setLineRows] = useState<InvoiceItemCreate[]>([
    { description: '', quantity: 1, salePrice: 0, discount: 0, taxRate: 0 },
  ]);
  const [createInstallmentPlan, setCreateInstallmentPlan] = useState(false);
  const [installmentCount, setInstallmentCount] = useState('3');
  const [installmentFrequency, setInstallmentFrequency] = useState('monthly');
  const [installmentFirstDueDate, setInstallmentFirstDueDate] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);

  const filters: InvoiceFilters = useMemo(() => {
    const f: InvoiceFilters = {};
    if (search.trim()) f.search = search.trim();
    if (statusFilter !== 'all') f.status = statusFilter;
    return f;
  }, [search, statusFilter]);

  const loadList = useCallback(async () => {
    const res = await fetchInvoicesPaged(filters, page, PAGE_SIZE);
    setInvoices(res.invoices ?? []);
    const pag = res.pagination as { pages?: number } | undefined;
    setTotalPages(Math.max(1, pag?.pages ?? 1));
  }, [filters, page]);

  const loadDashboard = useCallback(async () => {
    const d = await getInvoiceDashboard();
    setDashboard(d);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadList(), loadDashboard()]);
      if (products.length === 0) {
        const productRows = await fetchInvoiceProducts();
        setProducts(productRows);
      }
    } catch (e) {
      appError('Invoices', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [loadList, loadDashboard, products.length]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/sales/invoices',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (custQuery.trim().length < 2) {
        setCustHits([]);
        return;
      }
      void (async () => {
        try {
          const rows = await searchInvoiceCustomers(custQuery.trim(), 25);
          setCustHits(rows ?? []);
        } catch {
          setCustHits([]);
        }
      })();
    }, 400);
    return () => clearTimeout(t);
  }, [custQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const resetCreate = () => {
    setCustQuery('');
    setCustHits([]);
    setCustomerId('');
    setCustomerName('');
    setCustomerEmail('');
    const today = new Date().toISOString().slice(0, 10);
    const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    setIssueDate(today);
    setDueDate(due);
    setLabourCost('0');
    setTerms('');
    setLineRows([
      { description: '', quantity: 1, salePrice: 0, discount: 0, taxRate: 0 },
    ]);
    setCreateInstallmentPlan(false);
    setInstallmentCount('3');
    setInstallmentFrequency('monthly');
    setInstallmentFirstDueDate(due);
  };

  const submitCreate = async () => {
    const items = buildItemsPayload(lineRows);
    if (!customerId || !customerName.trim() || !customerEmail.trim()) {
      appAlert('Invoices', 'Select a customer with name and email.');
      return;
    }
    const labour = parseFloat(labourCost) || 0;
    const payload: InvoiceCreate = {
      customerId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      billingAddress: '',
      shippingAddress: '',
      issueDate: new Date(`${issueDate}T12:00:00`).toISOString(),
      dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
      orderNumber: '',
      orderTime: new Date().toISOString().slice(0, 16),
      labourCost: labour,
      terms: terms.trim() || undefined,
      items,
    };
    try {
      setSaving(true);
      const created = await createInvoice(payload);
      const subtotalAmount = items.reduce(
        (sum, item) => sum + item.quantity * item.salePrice,
        0,
      );
      const totalAmount = subtotalAmount + labour;
      if (createInstallmentPlan && totalAmount > 0) {
        await createInstallmentPlanApi({
          invoice_id: created.id,
          total_amount: Number(totalAmount.toFixed(2)),
          number_of_installments: Math.max(1, parseInt(installmentCount, 10) || 1),
          frequency: installmentFrequency,
          first_due_date: `${(installmentFirstDueDate || dueDate).trim()}T00:00:00Z`,
          currency: 'USD',
        });
      }
      setCreateOpen(false);
      resetCreate();
      await loadAll();
    } catch (e) {
      appError('Invoices', extractErrorMessage(e, 'Failed to create'));
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (inv: Invoice) => {
    try {
      const full = await getInvoice(inv.id);
      setSelected(full);
      setDetailOpen(true);
    } catch (e) {
      appError('Invoices', extractErrorMessage(e, 'Failed to open'));
    }
  };

  const handleMarkPaid = async () => {
    if (!selected) return;
    try {
      await markInvoicePaid(selected.id);
      const full = await getInvoice(selected.id);
      setSelected(full);
      await loadAll();
    } catch (e) {
      appError('Invoices', extractErrorMessage(e, 'Failed'));
    }
  };

  const handleSendEmail = async () => {
    if (!selected) return;
    try {
      await sendInvoiceEmail(
        selected.id,
        emailTo.trim() || undefined,
        emailBody.trim() || undefined,
      );
      setEmailOpen(false);
      appAlert('Invoices', 'Email sent.');
    } catch (e) {
      appError('Invoices', extractErrorMessage(e, 'Failed to send'));
    }
  };

  const handleWhatsApp = async () => {
    if (!selected) return;
    try {
      const res = await sendInvoiceWhatsApp(selected.id);
      if (res.whatsapp_url) {
        await Linking.openURL(res.whatsapp_url);
      }
    } catch (e) {
      appError('Invoices', extractErrorMessage(e, 'Failed'));
    }
  };

  const handlePdf = async () => {
    if (!selected) return;
    try {
      await sharePdfFromAuthenticatedPath(
        `/invoices/${selected.id}/download`,
        `invoice-${selected.invoiceNumber}.pdf`,
      );
    } catch (e) {
      appError('Invoices', extractErrorMessage(e, 'Could not share PDF'));
    }
  };

  const handleDelete = (inv: Invoice) => {
    appConfirm({
      title: 'Delete invoice',
      message: inv.invoiceNumber,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => void doDelete(inv.id),
    });
  };

  const doDelete = async (id: string) => {
    try {
      await deleteInvoice(id);
      setDetailOpen(false);
      setSelected(null);
      await loadAll();
    } catch (e) {
      appError('Invoices', extractErrorMessage(e, 'Failed to delete'));
    }
  };

  const canEdit = canManageInvoices() || canManageSales();
  const lineSubtotal = useMemo(
    () =>
      lineRows.reduce((sum, row) => {
        const qty = Math.max(1, Number(row.quantity) || 1);
        const unit = Number(row.salePrice) || 0;
        return sum + qty * unit;
      }, 0),
    [lineRows],
  );
  const invoiceLabourCost = Number(labourCost) || 0;
  const invoiceTotal = lineSubtotal + invoiceLabourCost;

  const statusChipOptions = STATUS_OPTS.map((o) => o.value);

  const listContent = (
    <>
      <WorkshopFilterBar
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search invoices…"
        resultCount={invoices.length}
        activeFilterCount={countActiveFilters([statusFilter])}
        onResetFilters={() => {
          setStatusFilter('all');
          setPage(1);
        }}
      >
        <WorkshopChipSelect
          label="Status"
          options={statusChipOptions}
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        />
      </WorkshopFilterBar>

      {loading && !refreshing ? (
        <WorkshopLoading />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={invoices}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WS.primary} />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="receipt-outline"
              title="No invoices"
              subtitle="Create your first invoice to get started."
              actionLabel={canEdit ? 'New invoice' : undefined}
              onAction={canEdit ? () => { resetCreate(); setCreateOpen(true); } : undefined}
            />
          }
          renderItem={({ item }) => {
            const sc = invoiceStatusColor(item.status);
            return (
              <WorkshopListCard
                icon={invoiceStatusIcon(item.status)}
                iconColor={sc.icon}
                iconBg={sc.bg}
                title={item.customerName}
                subtitle={item.invoiceNumber}
                meta={`Due ${new Date(item.dueDate).toLocaleDateString()} · ${formatUsd(item.total)}`}
                badges={[{ label: item.status, tone: 'status' }]}
                onPress={() => void openDetail(item)}
                actions={
                  canEdit
                    ? [
                        { icon: 'eye-outline', onPress: () => void openDetail(item) },
                        { icon: 'trash-outline', onPress: () => handleDelete(item), danger: true },
                      ]
                    : [{ icon: 'eye-outline', onPress: () => void openDetail(item) }]
                }
              />
            );
          }}
        />
      )}

      {totalPages > 1 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: WS.border }}>
          <Pressable disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))} style={{ opacity: page <= 1 ? 0.4 : 1 }}>
            <Text style={{ fontWeight: '700', color: WS.primary }}>Prev</Text>
          </Pressable>
          <Text style={{ color: WS.textMuted }}>{page} / {totalPages}</Text>
          <Pressable disabled={page >= totalPages} onPress={() => setPage((p) => p + 1)} style={{ opacity: page >= totalPages ? 0.4 : 1 }}>
            <Text style={{ fontWeight: '700', color: WS.primary }}>Next</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );

  const dashboardContent = (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WS.primary} />
      }
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {dashboard ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <WorkshopStatCard
              label="Total invoices"
              value={dashboard.metrics.totalInvoices}
              icon="receipt-outline"
              accent="#2563eb"
              accentBg="#eff6ff"
            />
            <WorkshopStatCard
              label="Paid"
              value={dashboard.metrics.paidInvoices}
              icon="checkmark-done-outline"
              accent="#059669"
              accentBg="#ecfdf5"
            />
            <WorkshopStatCard
              label="Overdue"
              value={dashboard.metrics.overdueInvoices}
              icon="time-outline"
              accent="#e11d48"
              accentBg="#fef2f2"
            />
            <WorkshopStatCard
              label="Revenue"
              value={formatUsd(dashboard.metrics.totalRevenue)}
              icon="cash-outline"
              accent="#4f46e5"
              accentBg="#eef2ff"
            />
          </View>

          <View
            style={{
              backgroundColor: '#0f172a',
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
              Total outstanding
            </Text>
            <Text style={{ marginTop: 6, fontSize: 28, fontWeight: '800', color: '#fff' }}>
              {formatUsd(dashboard.metrics.outstandingAmount)}
            </Text>
          </View>

          <Text style={{ fontSize: 16, fontWeight: '800', color: WS.text, marginBottom: 12 }}>
            Recent activity
          </Text>
          {(dashboard.recentInvoices ?? []).slice(0, 5).map((inv) => {
            const sc = invoiceStatusColor(inv.status);
            return (
              <WorkshopListCard
                key={inv.id}
                icon={invoiceStatusIcon(inv.status)}
                iconColor={sc.icon}
                iconBg={sc.bg}
                title={inv.invoiceNumber}
                subtitle={inv.customerName}
                meta={formatUsd(inv.total)}
                badges={[{ label: inv.status, tone: 'status' }]}
                onPress={() => void openDetail(inv)}
              />
            );
          })}
        </>
      ) : (
        <WorkshopEmptyState icon="stats-chart-outline" title="No data" subtitle="Dashboard metrics are not available yet." />
      )}
    </ScrollView>
  );

  return (
    <>
      <WorkshopChrome
        title="Invoices"
        subtitle="Billing & payments"
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Pressable
              onPress={() => setWorkspacePath('/settings/invoice')}
              hitSlop={8}
              style={{ padding: 4 }}
            >
              <Ionicons name="settings-outline" size={24} color={WS.textMuted} />
            </Pressable>
            {canEdit ? (
              <WorkshopHeaderButton
                onPress={() => {
                  resetCreate();
                  setCreateOpen(true);
                }}
              />
            ) : (
              <View style={{ width: 72 }} />
            )}
          </View>
        }
        scroll={false}
      >
        <WorkshopSegmentTabs
          tabs={[
            { key: 'list' as const, label: 'Invoices', icon: 'list' },
            { key: 'dashboard' as const, label: 'Dashboard', icon: 'stats-chart' },
          ]}
          active={tab}
          onChange={setTab}
        />
        {tab === 'list' ? listContent : dashboardContent}
      </WorkshopChrome>

      <WorkshopFormSheet
        visible={createOpen}
        title="New invoice"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <WorkshopPrimaryButton
              label={saving ? 'Saving…' : 'Save invoice'}
              onPress={() => void submitCreate()}
              disabled={saving}
            />
            <Pressable onPress={() => setCreateOpen(false)} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        <WorkshopFieldLabel>Find customer</WorkshopFieldLabel>
        <WorkshopTextInput
          value={custQuery}
          onChangeText={setCustQuery}
          placeholder="Type name, email, phone…"
        />
        {custHits.length > 0 ? (
          <View style={{ maxHeight: 160, borderWidth: 1, borderColor: WS.border, borderRadius: 12, marginBottom: 10 }}>
            <FlatList
              data={custHits}
              keyExtractor={(c) => c.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setCustomerId(String(item.id));
                    setCustomerName(customerLabel(item));
                    setCustomerEmail(String(item.email ?? ''));
                    setCustHits([]);
                    setCustQuery('');
                  }}
                  style={{ borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 10 }}
                >
                  <Text style={{ fontWeight: '600', color: WS.text }}>{customerLabel(item)}</Text>
                  {item.email ? (
                    <Text style={{ fontSize: 13, color: WS.textMuted }}>{item.email}</Text>
                  ) : null}
                </Pressable>
              )}
            />
          </View>
        ) : null}

        <WorkshopFieldLabel>Customer name</WorkshopFieldLabel>
        <WorkshopTextInput value={customerName} onChangeText={setCustomerName} />
        <WorkshopFieldLabel>Email</WorkshopFieldLabel>
        <WorkshopTextInput
          value={customerEmail}
          onChangeText={setCustomerEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="Issue date" value={issueDate} onChange={setIssueDate} />
          </View>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="Due date" value={dueDate} onChange={setDueDate} />
          </View>
        </View>

        <WorkshopFieldLabel>Labour Cost</WorkshopFieldLabel>
        <WorkshopTextInput value={labourCost} onChangeText={setLabourCost} keyboardType="decimal-pad" placeholder="0" />

        <Text style={{ fontSize: 15, fontWeight: '700', color: WS.text, marginTop: 8, marginBottom: 10 }}>
          Line items
        </Text>
        {lineRows.map((row, idx) => (
          <View
            key={idx}
            style={{
              borderWidth: 1,
              borderColor: WS.border,
              borderRadius: 12,
              padding: 12,
              marginBottom: 10,
            }}
          >
            <WorkshopPickerField
              label="Product"
              value={
                row.productId
                  ? products.find((p) => p.id === row.productId)?.name || 'Selected product'
                  : ''
              }
              placeholder="Select product"
              onPress={() => {
                setActiveLineIndex(idx);
                setProductSheetOpen(true);
              }}
            />
            <WorkshopFieldLabel>Description</WorkshopFieldLabel>
            <WorkshopTextInput
              value={row.description}
              onChangeText={(t) => {
                const next = [...lineRows];
                next[idx] = { ...row, description: t };
                setLineRows(next);
              }}
              placeholder="Description"
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ width: 72 }}>
                <WorkshopFieldLabel>Qty</WorkshopFieldLabel>
                <WorkshopTextInput
                  value={String(row.quantity)}
                  onChangeText={(t) => {
                    const next = [...lineRows];
                    next[idx] = { ...row, quantity: parseInt(t, 10) || 1 };
                    setLineRows(next);
                  }}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <WorkshopFieldLabel>Sale price</WorkshopFieldLabel>
                <WorkshopTextInput
                  value={String(row.salePrice)}
                  onChangeText={(t) => {
                    const next = [...lineRows];
                    next[idx] = { ...row, salePrice: parseFloat(t) || 0 };
                    setLineRows(next);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="Price"
                />
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
              <Text style={{ fontSize: 12, color: WS.textMuted }}>Line total</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: WS.text }}>
                {formatUsd(
                  Math.max(1, Number(row.quantity) || 1) * (Number(row.salePrice) || 0),
                )}
              </Text>
            </View>
          </View>
        ))}

        <WorkshopOutlineButton
          label="Add line"
          onPress={() =>
            setLineRows((r) => [
              ...r,
              { description: '', quantity: 1, salePrice: 0, discount: 0, taxRate: 0 },
            ])
          }
        />

        <View style={{ borderWidth: 1, borderColor: WS.border, borderRadius: 14, padding: 14, marginTop: 12, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: WS.textMuted }}>Subtotal</Text>
            <Text style={{ fontWeight: '700', color: WS.text }}>{formatUsd(lineSubtotal)}</Text>
          </View>
          {invoiceLabourCost > 0 ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ color: WS.textMuted }}>Labour Cost</Text>
              <Text style={{ fontWeight: '700', color: WS.text }}>{formatUsd(invoiceLabourCost)}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: WS.text }}>Total</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: WS.primary }}>{formatUsd(invoiceTotal)}</Text>
          </View>
        </View>

        <View style={{ borderWidth: 1, borderColor: WS.border, borderRadius: 14, padding: 14 }}>
          <Pressable
            onPress={() => setCreateInstallmentPlan((prev) => !prev)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: WS.text }}>Create installment plan</Text>
            <View
              style={{
                width: 44,
                height: 26,
                borderRadius: 13,
                backgroundColor: createInstallmentPlan ? WS.primary : '#cbd5e1',
                padding: 2,
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: '#fff',
                  alignSelf: createInstallmentPlan ? 'flex-end' : 'flex-start',
                }}
              />
            </View>
          </Pressable>
          {createInstallmentPlan ? (
            <View style={{ marginTop: 12 }}>
              <WorkshopFieldLabel>Number of installments</WorkshopFieldLabel>
              <WorkshopTextInput value={installmentCount} onChangeText={setInstallmentCount} keyboardType="number-pad" />
              <WorkshopChipSelect
                label="Frequency"
                options={['weekly', 'monthly', 'quarterly']}
                value={installmentFrequency}
                onChange={setInstallmentFrequency}
              />
              <WorkshopDatePickerField label="First due date" value={installmentFirstDueDate} onChange={setInstallmentFirstDueDate} />
            </View>
          ) : null}
        </View>
      </WorkshopFormSheet>

      <OptionSheet
        visible={productSheetOpen}
        title="Select Product"
        options={products.map((p) => ({
          value: p.id,
          label: `${p.name}${p.sku ? ` (${p.sku})` : ''}`,
        }))}
        onSelect={(productId) => {
          if (activeLineIndex == null) {
            setProductSheetOpen(false);
            return;
          }
          const product = products.find((p) => p.id === productId);
          if (!product) {
            setProductSheetOpen(false);
            return;
          }
          setLineRows((prev) =>
            prev.map((line, i) =>
              i === activeLineIndex
                ? {
                    ...line,
                    productId: product.id,
                    description: line.description?.trim() ? line.description : product.name,
                    salePrice: Number(line.salePrice) > 0 ? line.salePrice : product.salePrice,
                  }
                : line,
            ),
          );
          setProductSheetOpen(false);
        }}
        onClose={() => setProductSheetOpen(false)}
      />

      <WorkshopFormSheet
        visible={detailOpen}
        title={selected?.invoiceNumber ?? 'Invoice details'}
        onClose={() => {
          setDetailOpen(false);
          setSelected(null);
        }}
        footer={
          selected && canEdit ? (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <WorkshopOutlineButton label="Mark paid" onPress={() => void handleMarkPaid()} />
                </View>
                <View style={{ flex: 1 }}>
                  <WorkshopPrimaryButton
                    label="Email"
                    onPress={() => {
                      setEmailTo(selected.customerEmail);
                      setEmailBody('');
                      setEmailOpen(true);
                    }}
                  />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <WorkshopOutlineButton label="WhatsApp" onPress={() => void handleWhatsApp()} />
                </View>
                <View style={{ flex: 1 }}>
                  <WorkshopOutlineButton label="PDF" onPress={() => void handlePdf()} />
                </View>
              </View>
              <Pressable
                onPress={() => handleDelete(selected)}
                style={{
                  alignItems: 'center',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: WS.danger,
                  paddingVertical: 14,
                  marginTop: 4,
                }}
              >
                <Text style={{ fontWeight: '700', color: WS.danger }}>Delete invoice</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setDetailOpen(false)} style={{ alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Close</Text>
            </Pressable>
          )
        }
      >
        {selected ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <WorkshopBadge label={selected.status} tone="status" />
              <Text style={{ fontSize: 22, fontWeight: '800', color: WS.primary }}>{formatUsd(selected.total)}</Text>
            </View>
            <WorkshopDetailRow label="Customer" value={selected.customerName} />
            <WorkshopDetailRow label="Email" value={selected.customerEmail || '—'} />
            <WorkshopDetailRow label="Issue date" value={new Date(selected.issueDate).toLocaleDateString()} />
            <WorkshopDetailRow label="Due date" value={new Date(selected.dueDate).toLocaleDateString()} />

            <Text style={{ fontSize: 15, fontWeight: '700', color: WS.text, marginTop: 16, marginBottom: 8 }}>
              Line items
            </Text>
            {(selected.items ?? []).map((item, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f1f5f9',
                }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontWeight: '700', color: WS.text }}>{item.description}</Text>
                  <Text style={{ fontSize: 12, color: WS.textMuted }}>
                    Qty {item.quantity} × {formatUsd(item.salePrice)}
                  </Text>
                </View>
                <Text style={{ fontWeight: '800', color: WS.text }}>{formatUsd(item.total)}</Text>
              </View>
            ))}

            <WorkshopDetailRow label="Subtotal" value={formatUsd(selected.subtotal)} />
            {selected.labourCost ? (
              <WorkshopDetailRow label="Labour Cost" value={formatUsd(selected.labourCost)} />
            ) : null}
            <WorkshopDetailRow label="Total" value={formatUsd(selected.total)} />

            {!canEdit ? (
              <Text style={{ marginTop: 12, fontSize: 13, color: WS.textMuted, fontStyle: 'italic' }}>
                View-only permissions
              </Text>
            ) : null}
          </>
        ) : (
          <WorkshopLoading />
        )}
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={emailOpen}
        title="Send email"
        onClose={() => setEmailOpen(false)}
        footer={
          <>
            <WorkshopPrimaryButton label="Send" onPress={() => void handleSendEmail()} />
            <Pressable onPress={() => setEmailOpen(false)} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        <WorkshopFieldLabel>To</WorkshopFieldLabel>
        <WorkshopTextInput value={emailTo} onChangeText={setEmailTo} placeholder="To" keyboardType="email-address" autoCapitalize="none" />
        <WorkshopFieldLabel>Message</WorkshopFieldLabel>
        <WorkshopTextInput
          value={emailBody}
          onChangeText={setEmailBody}
          placeholder="Message"
          multiline
          style={{ minHeight: 88, textAlignVertical: 'top' }}
        />
      </WorkshopFormSheet>
    </>
  );
}
