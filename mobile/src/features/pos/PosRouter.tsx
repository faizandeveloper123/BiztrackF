import { useRBAC } from '../../contexts/RBACContext';
import { useSidebarDrawer } from '../../contexts/SidebarDrawerContext';
import { evalSidebarPathPermission } from '../../hooks/useSidebarFilteredMenu';
import { MenuHeaderButton } from '../../components/layout/MenuHeaderButton';
import { View, Text, Pressable } from 'react-native';
import { MobilePosDashboardScreen } from './screens/MobilePosDashboardScreen';
import { MobilePosNewSaleScreen } from './screens/MobilePosNewSaleScreen';
import { MobilePosProductsScreen } from './screens/MobilePosProductsScreen';
import { MobilePosTransactionsScreen } from './screens/MobilePosTransactionsScreen';
import { MobilePosShiftsScreen } from './screens/MobilePosShiftsScreen';
import { MobilePosReportsScreen } from './screens/MobilePosReportsScreen';
import { isPosWorkspacePath } from './posPaths';

function PosAccessDenied(props: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row border-b border-slate-200 bg-white px-3 py-2">
        <MenuHeaderButton />
      </View>
      <View className="flex-1 justify-center px-6">
        <Text className="text-center text-lg font-semibold text-slate-900">
          POS access
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

export function PosRouter() {
  const { workspacePath, setWorkspacePath } = useSidebarDrawer();
  const { hasPermission, isOwner, hasModuleAccess } = useRBAC();

  if (!isPosWorkspacePath(workspacePath)) {
    return null;
  }

  const ok =
    hasModuleAccess('pos') &&
    evalSidebarPathPermission(workspacePath, isOwner, hasPermission);

  if (!ok) {
    return (
      <PosAccessDenied onBack={() => setWorkspacePath('/dashboard')} />
    );
  }

  switch (workspacePath) {
    case '/pos':
      return <MobilePosDashboardScreen />;
    case '/pos/sale':
      return <MobilePosNewSaleScreen />;
    case '/pos/products':
      return <MobilePosProductsScreen />;
    case '/pos/transactions':
      return <MobilePosTransactionsScreen />;
    case '/pos/shifts':
      return <MobilePosShiftsScreen />;
    case '/pos/reports':
      return <MobilePosReportsScreen />;
    default:
      return <PosAccessDenied onBack={() => setWorkspacePath('/dashboard')} />;
  }
}
