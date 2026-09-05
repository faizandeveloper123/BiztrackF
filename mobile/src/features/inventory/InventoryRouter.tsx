import { useRBAC } from '../../contexts/RBACContext';
import { useSidebarDrawer } from '../../contexts/SidebarDrawerContext';
import { evalSidebarPathPermission } from '../../hooks/useSidebarFilteredMenu';
import { MenuHeaderButton } from '../../components/layout/MenuHeaderButton';
import { View, Text, Pressable } from 'react-native';
import { MobileInventoryDashboardScreen } from './screens/MobileInventoryDashboardScreen';
import { MobileWarehousesScreen } from './screens/MobileWarehousesScreen';
import { MobileStorageLocationsScreen } from './screens/MobileStorageLocationsScreen';
import { MobileStockMovementsScreen } from './screens/MobileStockMovementsScreen';
import { MobilePurchaseOrdersScreen } from './screens/MobilePurchaseOrdersScreen';
import { MobileReceivingScreen } from './screens/MobileReceivingScreen';
import { MobileInventoryProductsScreen } from './screens/MobileInventoryProductsScreen';
import { MobileInventoryAlertsScreen } from './screens/MobileInventoryAlertsScreen';
import { MobileDumpsScreen } from './screens/MobileDumpsScreen';
import { MobileCustomerReturnsScreen } from './screens/MobileCustomerReturnsScreen';
import { MobileSupplierReturnsScreen } from './screens/MobileSupplierReturnsScreen';
import { isInventoryWorkspacePath } from './inventoryPaths';

function InventoryAccessDenied(props: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row border-b border-slate-200 bg-white px-3 py-2">
        <MenuHeaderButton />
      </View>
      <View className="flex-1 justify-center px-6">
        <Text className="text-center text-lg font-semibold text-slate-900">
          Inventory access
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

export function InventoryRouter() {
  const { workspacePath, setWorkspacePath } = useSidebarDrawer();
  const { hasPermission, isOwner, hasModuleAccess } = useRBAC();

  if (!isInventoryWorkspacePath(workspacePath)) {
    return null;
  }

  const ok =
    hasModuleAccess('inventory') &&
    evalSidebarPathPermission(workspacePath, isOwner, hasPermission);

  if (!ok) {
    return (
      <InventoryAccessDenied onBack={() => setWorkspacePath('/dashboard')} />
    );
  }

  switch (workspacePath) {
    case '/inventory':
      return <MobileInventoryDashboardScreen />;
    case '/inventory/warehouses':
      return <MobileWarehousesScreen />;
    case '/inventory/storage-locations':
      return <MobileStorageLocationsScreen />;
    case '/inventory/stock-movements':
      return <MobileStockMovementsScreen />;
    case '/inventory/purchase-orders':
      return <MobilePurchaseOrdersScreen />;
    case '/inventory/receiving':
      return <MobileReceivingScreen />;
    case '/inventory/products':
      return <MobileInventoryProductsScreen />;
    case '/inventory/alerts':
      return <MobileInventoryAlertsScreen />;
    case '/inventory/dumps':
      return <MobileDumpsScreen />;
    case '/inventory/customer-returns':
      return <MobileCustomerReturnsScreen />;
    case '/inventory/supplier-returns':
      return <MobileSupplierReturnsScreen />;
    default:
      return (
        <InventoryAccessDenied onBack={() => setWorkspacePath('/dashboard')} />
      );
  }
}
