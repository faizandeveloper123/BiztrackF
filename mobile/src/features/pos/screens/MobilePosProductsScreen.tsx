import { MobileInventoryProductsScreen } from '../../inventory/screens/MobileInventoryProductsScreen';

export function MobilePosProductsScreen() {
  return (
    <MobileInventoryProductsScreen
      sidebarPathWhenNotDashboard="/pos/products"
      title="Products"
      manageScope="pos"
    />
  );
}
