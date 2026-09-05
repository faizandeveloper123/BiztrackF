import { useSidebarDrawer } from '../../contexts/SidebarDrawerContext';
import { useRBAC } from '../../contexts/RBACContext';
import { useAuth } from '../../contexts/AuthContext';
import { View, Text, Pressable } from 'react-native';
import { MenuHeaderButton } from '../../components/layout/MenuHeaderButton';
import { MobileGeneralSettingsScreen } from './screens/MobileGeneralSettingsScreen';
import { MobileInvoiceCustomizationScreen } from './screens/MobileInvoiceCustomizationScreen';
import { MobileNotificationSettingsScreen } from './screens/MobileNotificationSettingsScreen';
import { MobileSubscriptionManageScreen } from './screens/MobileSubscriptionManageScreen';
import { MobileNotificationsScreen } from '../notifications/screens/MobileNotificationsScreen';
import { isSettingsWorkspacePath } from './settingsPaths';
import { evalSidebarPathPermission } from '../../hooks/useSidebarFilteredMenu';

function SettingsFallback(props: { onBack: () => void; title?: string; message?: string }) {
  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row border-b border-slate-200 bg-white px-3 py-2">
        <MenuHeaderButton />
      </View>
      <View className="flex-1 justify-center px-6">
        <Text className="text-center text-lg font-semibold text-slate-900">
          {props.title ?? 'Settings route'}
        </Text>
        <Text className="mt-2 text-center text-slate-600">
          {props.message ?? 'This settings page is not available.'}
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

function canAccessOwnerAdminSettings(
  isOwner: () => boolean,
  userRole: string | undefined,
  hasPermission: (p: string) => boolean,
  path: string,
): boolean {
  if (isOwner()) return true;
  if (userRole === 'admin' || userRole === 'super_admin') return true;
  return evalSidebarPathPermission(path, isOwner, hasPermission);
}

export function SettingsRouter() {
  const { workspacePath, setWorkspacePath } = useSidebarDrawer();
  const { user } = useAuth();
  const { hasPermission, isOwner } = useRBAC();

  if (!isSettingsWorkspacePath(workspacePath)) {
    return null;
  }

  if (
    (workspacePath === '/settings' || workspacePath === '/settings/invoice') &&
    !canAccessOwnerAdminSettings(
      isOwner,
      user?.userRole,
      hasPermission,
      workspacePath,
    )
  ) {
    return (
      <SettingsFallback
        onBack={() => setWorkspacePath('/dashboard')}
        title="Settings"
        message="You do not have permission to open this page."
      />
    );
  }

  if (
    workspacePath === '/subscription/manage' &&
    !isOwner() &&
    user?.userRole !== 'admin' &&
    user?.userRole !== 'super_admin'
  ) {
    return (
      <SettingsFallback
        onBack={() => setWorkspacePath('/dashboard')}
        title="Subscription"
        message="You do not have permission to open this page."
      />
    );
  }

  switch (workspacePath) {
    case '/settings':
      return <MobileGeneralSettingsScreen />;
    case '/settings/invoice':
      return <MobileInvoiceCustomizationScreen />;
    case '/notifications':
      return <MobileNotificationsScreen />;
    case '/notifications/settings':
      return <MobileNotificationSettingsScreen />;
    case '/subscription/manage':
      return <MobileSubscriptionManageScreen />;
    default:
      return <SettingsFallback onBack={() => setWorkspacePath('/dashboard')} />;
  }
}
