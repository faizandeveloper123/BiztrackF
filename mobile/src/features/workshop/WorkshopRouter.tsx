import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSidebarDrawer } from '../../contexts/SidebarDrawerContext';
import { useRBAC } from '../../contexts/RBACContext';
import { evalSidebarPathPermission } from '../../hooks/useSidebarFilteredMenu';
import { MenuHeaderButton } from '../../components/layout/MenuHeaderButton';
import { MobileWorkshopJobCardsScreen } from './screens/MobileWorkshopJobCardsScreen';
import { MobileWorkshopVehiclesScreen } from './screens/MobileWorkshopVehiclesScreen';
import { MobileWorkshopQualityScreen } from './screens/MobileWorkshopQualityScreen';
import { MobileWorkshopMotBookingsScreen } from './screens/MobileWorkshopMotBookingsScreen';
import { WS } from './components/workshopTheme';

function WorkshopAccessDenied(props: { onBack: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: WS.bg }}>
      <View
        style={{
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderBottomColor: WS.border,
          backgroundColor: WS.card,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <MenuHeaderButton />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, alignItems: 'center' }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: WS.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Ionicons name="lock-closed" size={32} color={WS.primary} />
        </View>
        <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: '800', color: WS.text }}>
          Workshop access
        </Text>
        <Text style={{ marginTop: 8, textAlign: 'center', color: WS.textMuted, lineHeight: 22 }}>
          You do not have permission to open this module.
        </Text>
        <Pressable
          onPress={props.onBack}
          style={{
            marginTop: 24,
            width: '100%',
            alignItems: 'center',
            borderRadius: 14,
            backgroundColor: WS.primary,
            paddingVertical: 14,
          }}
        >
          <Text style={{ fontWeight: '700', color: '#fff' }}>Back to dashboard</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function WorkshopRouter() {
  const { workspacePath, setWorkspacePath } = useSidebarDrawer();
  const { hasPermission, isOwner, hasModuleAccess } = useRBAC();

  if (!isWorkshopWorkspacePath(workspacePath)) {
    return null;
  }

  const ok =
    hasModuleAccess('production') &&
    evalSidebarPathPermission(workspacePath, isOwner, hasPermission);

  if (!ok) {
    return <WorkshopAccessDenied onBack={() => setWorkspacePath('/dashboard')} />;
  }

  switch (workspacePath) {
    case '/workshop-management/job-cards':
      return <MobileWorkshopJobCardsScreen />;
    case '/workshop-management/vehicles':
      return <MobileWorkshopVehiclesScreen />;
    case '/workshop-management/quality-control':
      return <MobileWorkshopQualityScreen />;
    case '/workshop-management/mot/bookings':
      return <MobileWorkshopMotBookingsScreen />;
    default:
      return <WorkshopAccessDenied onBack={() => setWorkspacePath('/dashboard')} />;
  }
}

export function isWorkshopWorkspacePath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return n.startsWith('/workshop-management/');
}
