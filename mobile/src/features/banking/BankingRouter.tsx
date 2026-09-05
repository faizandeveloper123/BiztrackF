import { useRBAC } from '../../contexts/RBACContext';
import { useSidebarDrawer } from '../../contexts/SidebarDrawerContext';
import { evalSidebarPathPermission } from '../../hooks/useSidebarFilteredMenu';
import { MenuHeaderButton } from '../../components/layout/MenuHeaderButton';
import { View, Text, Pressable } from 'react-native';
import { MobileBankingDashboardScreen } from './screens/MobileBankingDashboardScreen';
import { MobileBankAccountsScreen } from './screens/MobileBankAccountsScreen';
import { MobileBankTransactionsScreen } from './screens/MobileBankTransactionsScreen';
import { MobileBankReconciliationScreen } from './screens/MobileBankReconciliationScreen';
import { isBankingWorkspacePath } from './bankingPaths';

function BankingAccessDenied(props: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row border-b border-slate-200 bg-white px-3 py-2">
        <MenuHeaderButton />
      </View>
      <View className="flex-1 justify-center px-6">
        <Text className="text-center text-lg font-semibold text-slate-900">
          Banking
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

export function BankingRouter() {
  const { workspacePath, setWorkspacePath } = useSidebarDrawer();
  const { hasPermission, isOwner, hasModuleAccess } = useRBAC();

  if (!isBankingWorkspacePath(workspacePath)) {
    return null;
  }

  if (!hasModuleAccess('banking')) {
    return (
      <BankingAccessDenied onBack={() => setWorkspacePath('/dashboard')} />
    );
  }

  const pathOk =
    workspacePath === '/banking'
      ? true
      : evalSidebarPathPermission(workspacePath, isOwner, hasPermission);

  if (!pathOk) {
    return (
      <BankingAccessDenied onBack={() => setWorkspacePath('/dashboard')} />
    );
  }

  switch (workspacePath) {
    case '/banking':
      return <MobileBankingDashboardScreen />;
    case '/banking/accounts':
      return <MobileBankAccountsScreen />;
    case '/banking/transactions':
      return <MobileBankTransactionsScreen />;
    case '/banking/reconciliation':
      return <MobileBankReconciliationScreen />;
    default:
      return (
        <BankingAccessDenied onBack={() => setWorkspacePath('/dashboard')} />
      );
  }
}
