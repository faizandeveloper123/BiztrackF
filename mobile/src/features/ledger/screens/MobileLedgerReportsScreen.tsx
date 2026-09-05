import { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appError } from '../../../utils/appDialog';
import type {
  IncomeStatementResponse,
  TrialBalanceResponse,
} from '../../../models/ledger';
import {
  getBalanceSheet,
  getIncomeStatement,
  getTrialBalance,
} from '../../../services/ledger/ledgerMobileApi';
import { formatMoney } from '../ledgerFormat';
import {
  WorkshopChrome,
  WorkshopLoading,
  WorkshopSegmentTabs,
  WorkshopDatePickerField,
  WorkshopPrimaryButton,
  WorkshopCard,
  WorkshopDetailRow,
  WorkshopListCard,
  WS,
} from '../../workshop/components/WorkshopChrome';

type Tab = 'trial' | 'income' | 'balance';

function parseDateInputToIso(dateInput: string): string | null {
  const trimmed = dateInput.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function MobileLedgerReportsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const [tab, setTab] = useState<Tab>('trial');
  const [asOf, setAsOf] = useState(() => new Date().toISOString().split('T')[0]);
  const [start, setStart] = useState(() =>
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  );
  const [end, setEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [trial, setTrial] = useState<TrialBalanceResponse | null>(null);
  const [income, setIncome] = useState<IncomeStatementResponse | null>(null);
  const [balance, setBalance] = useState<unknown>(null);

  const run = useCallback(async () => {
    try {
      setLoading(true);
      if (tab === 'trial') {
        if (!parseDateInputToIso(asOf)) {
          appAlert('Reports', 'Use valid as-of date format YYYY-MM-DD.');
          return;
        }
        const t = await getTrialBalance(asOf);
        setTrial(t);
      } else if (tab === 'income') {
        const startIso = parseDateInputToIso(start);
        const endIso = parseDateInputToIso(end);
        if (!startIso || !endIso) {
          appAlert('Reports', 'Use valid start/end date format YYYY-MM-DD.');
          return;
        }
        const i = await getIncomeStatement(startIso, endIso);
        setIncome(i);
      } else {
        if (!parseDateInputToIso(asOf)) {
          appAlert('Reports', 'Use valid as-of date format YYYY-MM-DD.');
          return;
        }
        const b = await getBalanceSheet(asOf);
        setBalance(b);
      }
    } catch (e) {
      appError('Reports', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [tab, asOf, start, end]);

  useEffect(() => {
    setSidebarActivePath(workspacePath === '/dashboard' ? '/dashboard' : '/ledger/reports');
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void run();
  }, [run]);

  return (
    <WorkshopChrome title="Reports" subtitle="Trial balance, income & balance sheet" scroll>
      <WorkshopSegmentTabs
        tabs={[
          { key: 'trial', label: 'Trial', icon: 'list' },
          { key: 'income', label: 'Income', icon: 'trending-up' },
          { key: 'balance', label: 'Balance', icon: 'pie-chart' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'income' ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="Start date" value={start} onChange={setStart} />
          </View>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="End date" value={end} onChange={setEnd} />
          </View>
        </View>
      ) : (
        <WorkshopDatePickerField label="As of date" value={asOf} onChange={setAsOf} />
      )}
      <WorkshopPrimaryButton label="Run report" onPress={() => void run()} />

      {loading ? (
        <WorkshopLoading />
      ) : (
        <>
          {tab === 'trial' && trial ? (
            <>
              <Text style={{ fontSize: 13, color: WS.textMuted, marginBottom: 12 }}>
                As of {new Date(trial.as_of_date).toLocaleDateString()}
              </Text>
              {(trial.accounts ?? []).map((a) => (
                <WorkshopListCard
                  key={a.account_id}
                  icon="book"
                  iconColor="#4f46e5"
                  iconBg="#eef2ff"
                  title={`${a.account_code} ${a.account_name}`}
                  meta={`Dr ${formatMoney(a.debit_balance)} · Cr ${formatMoney(a.credit_balance)}`}
                />
              ))}
            </>
          ) : null}

          {tab === 'income' && income ? (
            <WorkshopCard>
              <WorkshopDetailRow label="Revenue" value={formatMoney(income.revenue)} />
              <WorkshopDetailRow label="Expenses" value={formatMoney(income.expenses)} />
              <WorkshopDetailRow label="Net income" value={formatMoney(income.net_income)} />
              <Text style={{ marginTop: 8, fontSize: 12, color: WS.textMuted }}>
                {new Date(income.start_date).toLocaleDateString()} –{' '}
                {new Date(income.end_date).toLocaleDateString()}
              </Text>
            </WorkshopCard>
          ) : null}

          {tab === 'balance' && balance ? <BalanceSheetView data={balance} /> : null}
        </>
      )}
    </WorkshopChrome>
  );
}

function BalanceSheetView({ data }: { data: unknown }) {
  const o = data as Record<string, unknown>;
  const assets = o.assets as Record<string, unknown> | undefined;
  const liab = o.liabilities as Record<string, unknown> | undefined;
  const equity = o.equity as Record<string, unknown> | undefined;
  const asOf = o.as_of_date;

  if (assets && typeof assets === 'object') {
    return (
      <View>
        <Text style={{ fontSize: 13, color: WS.textMuted, marginBottom: 12 }}>
          As of {asOf ? new Date(String(asOf)).toLocaleDateString() : '—'}
        </Text>
        <Section title="Assets" sec={assets} />
        <Section title="Liabilities" sec={liab} />
        <Section title="Equity" sec={equity} />
        {typeof o.total_liabilities_and_equity === 'number' ? (
          <Text style={{ marginTop: 8, fontWeight: '700', fontSize: 15, color: WS.text }}>
            L+E {formatMoney(o.total_liabilities_and_equity as number)}
          </Text>
        ) : null}
      </View>
    );
  }

  const ta = o.total_assets;
  const tl = o.total_liabilities;
  const te = o.total_equity;
  return (
    <WorkshopCard>
      {typeof ta === 'number' ? (
        <WorkshopDetailRow label="Total assets" value={formatMoney(ta)} />
      ) : null}
      {typeof tl === 'number' ? (
        <WorkshopDetailRow label="Total liabilities" value={formatMoney(tl)} />
      ) : null}
      {typeof te === 'number' ? (
        <WorkshopDetailRow label="Total equity" value={formatMoney(te)} />
      ) : null}
    </WorkshopCard>
  );
}

function Section({
  title,
  sec,
}: {
  title: string;
  sec?: Record<string, unknown>;
}) {
  if (!sec) return null;
  const total = sec.total as number | undefined;
  const accounts = sec.accounts as Array<{ account_name?: string; balance?: number }> | undefined;
  return (
    <WorkshopCard>
      <Text style={{ fontSize: 15, fontWeight: '700', color: WS.text, marginBottom: 8 }}>{title}</Text>
      {typeof total === 'number' ? (
        <Text style={{ fontSize: 13, color: WS.textMuted, marginBottom: 8 }}>
          Total {formatMoney(total)}
        </Text>
      ) : null}
      {(accounts ?? []).map((a, i) => (
        <WorkshopDetailRow
          key={i}
          label={a.account_name ?? '—'}
          value={formatMoney(a.balance ?? 0)}
        />
      ))}
    </WorkshopCard>
  );
}
