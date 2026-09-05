import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { apiService } from '../../../services/ApiService';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appError } from '../../../utils/appDialog';
import { formatMoney } from '../../ledger/ledgerFormat';
import {
  WorkshopChrome,
  WorkshopCard,
  WorkshopLoading,
  WorkshopDetailRow,
  WorkshopOutlineButton,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopPrimaryButton,
  WS,
} from '../../workshop/components/WorkshopChrome';

export function MobileSubscriptionManageScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const tenantId = apiService.getTenantId();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sub, setSub] = useState<Record<string, unknown> | null>(null);
  const [billing, setBilling] = useState<Record<string, unknown> | null>(null);
  const [usage, setUsage] = useState<Record<string, unknown> | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const [s, b, u] = await Promise.all([
        apiService.get('/tenants/current/subscription').catch(() => null),
        apiService.getSubscriptionBilling(tenantId).catch(() => null),
        apiService.getSubscriptionUsage(tenantId).catch(() => null),
      ]);
      let subscription: Record<string, unknown> | null = null;
      if (s && typeof s === 'object') {
        const o = s as {
          success?: boolean;
          subscription?: Record<string, unknown>;
        };
        if (o.subscription && typeof o.subscription === 'object') {
          subscription = o.subscription;
        }
      }
      setSub(subscription);
      setBilling(
        b && typeof b === 'object' ? (b as Record<string, unknown>) : null,
      );
      setUsage(u && typeof u === 'object' ? (u as Record<string, unknown>) : null);
    } catch (e) {
      appError('Subscription', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/subscription/manage',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const sync = useCallback(async () => {
    if (!tenantId) return;
    try {
      setSyncing(true);
      await apiService.syncSubscriptionStatus(tenantId);
      await load();
      appAlert('Subscription', 'Synced.');
    } catch (e) {
      appError('Subscription', extractErrorMessage(e, 'Sync failed'));
    } finally {
      setSyncing(false);
    }
  }, [tenantId, load]);

  const doCancel = useCallback(async () => {
    if (!tenantId || !cancelReason.trim()) {
      appAlert('Subscription', 'Enter a cancellation reason.');
      return;
    }
    try {
      setCancelling(true);
      await apiService.cancelSubscription(tenantId, cancelReason.trim());
      setCancelOpen(false);
      setCancelReason('');
      await load();
      appAlert('Subscription', 'Cancellation requested.');
    } catch (e) {
      appError('Subscription', extractErrorMessage(e, 'Cancel failed'));
    } finally {
      setCancelling(false);
    }
  }, [tenantId, cancelReason, load]);

  const plan = sub?.plan as Record<string, unknown> | undefined;

  return (
    <>
      <WorkshopChrome title="Subscription" subtitle="Plan & billing" scroll>
        {!tenantId ? (
          <Text style={{ textAlign: 'center', color: WS.textMuted, paddingVertical: 48 }}>
            Select a workspace to manage subscription.
          </Text>
        ) : loading ? (
          <WorkshopLoading />
        ) : (
          <>
            {plan ? (
              <WorkshopCard>
                <Text style={{ fontSize: 18, fontWeight: '800', color: WS.text }}>
                  {String(plan.name ?? 'Plan')}
                </Text>
                <Text style={{ fontSize: 14, color: WS.textMuted, marginTop: 4 }}>
                  {String(plan.planType ?? '')}
                </Text>
                {typeof plan.price === 'number' ? (
                  <Text style={{ fontSize: 16, color: WS.text, marginTop: 10, fontWeight: '600' }}>
                    {formatMoney(plan.price)} / {String(plan.billingCycle ?? '')}
                  </Text>
                ) : null}
              </WorkshopCard>
            ) : null}

            {billing ? (
              <WorkshopCard>
                <Text style={{ fontSize: 15, fontWeight: '700', color: WS.text, marginBottom: 8 }}>
                  Billing
                </Text>
                <WorkshopDetailRow label="Status" value={String(billing.status ?? '—')} />
                <WorkshopDetailRow label="Plan" value={String(billing.plan_name ?? '—')} />
                {typeof billing.monthly_price === 'number' ? (
                  <WorkshopDetailRow
                    label="Price"
                    value={formatMoney(billing.monthly_price as number)}
                  />
                ) : null}
                <WorkshopDetailRow label="Next billing" value={String(billing.next_billing_date ?? '—')} />
              </WorkshopCard>
            ) : null}

            {usage ? (
              <WorkshopCard>
                <Text style={{ fontSize: 15, fontWeight: '700', color: WS.text, marginBottom: 8 }}>
                  Usage
                </Text>
                <UsageBlock label="Projects" u={usage.projects as Record<string, number> | undefined} />
                <UsageBlock label="Users" u={usage.users as Record<string, number> | undefined} />
              </WorkshopCard>
            ) : null}

            <View style={{ marginBottom: 10 }}>
              <WorkshopOutlineButton
                label={syncing ? 'Syncing…' : 'Sync status'}
                onPress={() => void sync()}
              />
            </View>

            <Pressable
              onPress={() => setCancelOpen(true)}
              style={{
                alignItems: 'center',
                borderRadius: 14,
                paddingVertical: 14,
                backgroundColor: WS.danger,
                marginBottom: 24,
              }}
            >
              <Text style={{ fontWeight: '700', fontSize: 15, color: '#fff' }}>
                Cancel subscription
              </Text>
            </Pressable>
          </>
        )}
      </WorkshopChrome>

      <WorkshopFormSheet
        visible={cancelOpen}
        title="Cancel subscription"
        onClose={() => {
          setCancelOpen(false);
          setCancelReason('');
        }}
        footer={
          <View style={{ gap: 8 }}>
            <WorkshopPrimaryButton
              label={cancelling ? 'Submitting…' : 'Submit'}
              onPress={() => void doCancel()}
              disabled={cancelling}
            />
            <Pressable
              onPress={() => {
                setCancelOpen(false);
                setCancelReason('');
              }}
              style={{ alignItems: 'center', paddingVertical: 10 }}
            >
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Close</Text>
            </Pressable>
          </View>
        }
      >
        <WorkshopFieldLabel>Reason</WorkshopFieldLabel>
        <WorkshopTextInput
          value={cancelReason}
          onChangeText={setCancelReason}
          placeholder="Why are you cancelling?"
          multiline
          style={{ minHeight: 100 }}
        />
      </WorkshopFormSheet>
    </>
  );
}

function UsageBlock({
  label,
  u,
}: {
  label: string;
  u?: Record<string, number>;
}) {
  if (!u) return null;
  const cur = u.current ?? 0;
  const lim = u.limit ?? 0;
  return (
    <Text style={{ fontSize: 14, color: WS.text, marginBottom: 4 }}>
      {label}: {cur} / {lim}
    </Text>
  );
}
