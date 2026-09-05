import { useRBAC } from '../../contexts/RBACContext';
import { useSidebarDrawer } from '../../contexts/SidebarDrawerContext';
import { evalSidebarPathPermission } from '../../hooks/useSidebarFilteredMenu';
import { MenuHeaderButton } from '../../components/layout/MenuHeaderButton';
import { View, Text, Pressable } from 'react-native';
import { MobileLedgerDashboardScreen } from './screens/MobileLedgerDashboardScreen';
import { MobileLedgerProfitLossScreen } from './screens/MobileLedgerProfitLossScreen';
import { MobileLedgerInvestmentsScreen } from './screens/MobileLedgerInvestmentsScreen';
import { MobileLedgerTransactionsScreen } from './screens/MobileLedgerTransactionsScreen';
import { MobileLedgerAccountReceivablesScreen } from './screens/MobileLedgerAccountReceivablesScreen';
import { MobileLedgerReportsScreen } from './screens/MobileLedgerReportsScreen';
import { isLedgerWorkspacePath } from './ledgerPaths';

function LedgerAccessDenied(props: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row border-b border-slate-200 bg-white px-3 py-2">
        <MenuHeaderButton />
      </View>
      <View className="flex-1 justify-center px-6">
        <Text className="text-center text-lg font-semibold text-slate-900">
          Financial ledger
        </Text>
        <Text className="mt-2 text-center text-slate-600">
          You do not have permission to open this module.
        </Text>
        <Pressable
          className="mt-6 items-center rounded-lg bg-blue-600 py-3"
          onPress={props.onBack}
        >
          <Text className="font-semibold text-white">Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function LedgerRouter() {
  const { workspacePath, setWorkspacePath } = useSidebarDrawer();
  const { hasPermission, isOwner, hasModuleAccess } = useRBAC();

  if (!isLedgerWorkspacePath(workspacePath)) {
    return null;
  }

  if (!hasModuleAccess('ledger')) {
    return (
      <LedgerAccessDenied onBack={() => setWorkspacePath('/dashboard')} />
    );
  }

  if (!evalSidebarPathPermission(workspacePath, isOwner, hasPermission)) {
    return (
      <LedgerAccessDenied onBack={() => setWorkspacePath('/dashboard')} />
    );
  }

  switch (workspacePath) {
    case '/ledger':
      return <MobileLedgerDashboardScreen />;
    case '/ledger/profit-loss':
      return <MobileLedgerProfitLossScreen />;
    case '/ledger/investments':
      return <MobileLedgerInvestmentsScreen />;
    case '/ledger/transactions':
      return <MobileLedgerTransactionsScreen />;
    case '/ledger/account-receivables':
      return <MobileLedgerAccountReceivablesScreen />;
    case '/ledger/reports':
      return <MobileLedgerReportsScreen />;
    default:
      return (
        <LedgerAccessDenied onBack={() => setWorkspacePath('/dashboard')} />
      );
  }
}
