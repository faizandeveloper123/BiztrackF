import { useRBAC } from '../../contexts/RBACContext';
import { useSidebarDrawer } from '../../contexts/SidebarDrawerContext';
import { evalSidebarPathPermission } from '../../hooks/useSidebarFilteredMenu';
import { MenuHeaderButton } from '../../components/layout/MenuHeaderButton';
import { View, Text, Pressable } from 'react-native';
import { MobileReportsScreen } from './screens/MobileReportsScreen';
import { MobileEventsScreen } from './screens/MobileEventsScreen';
import { MobileUsersScreen } from './screens/MobileUsersScreen';
import { isWorkspaceHubPath } from './workspacePaths';

function HubAccessDenied(props: { onBack: () => void; title: string }) {
  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row border-b border-slate-200 bg-white px-3 py-2">
        <MenuHeaderButton />
      </View>
      <View className="flex-1 justify-center px-6">
        <Text className="text-center text-lg font-semibold text-slate-900">
          {props.title}
        </Text>
        <Text className="mt-2 text-center text-slate-600">
          You do not have permission to open this screen.
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

export function WorkspaceRouter() {
  const { workspacePath, setWorkspacePath } = useSidebarDrawer();
  const { hasPermission, isOwner, hasModuleAccess } = useRBAC();

  if (!isWorkspaceHubPath(workspacePath)) {
    return null;
  }

  const pathOk = evalSidebarPathPermission(
    workspacePath,
    isOwner,
    hasPermission,
  );

  if (workspacePath === '/users') {
    if (!isOwner() || !pathOk) {
      return (
        <HubAccessDenied
          title="User management"
          onBack={() => setWorkspacePath('/dashboard')}
        />
      );
    }
    return <MobileUsersScreen />;
  }

  if (workspacePath === '/reports') {
    if (!hasModuleAccess('reports') || !pathOk) {
      return (
        <HubAccessDenied
          title="Reports"
          onBack={() => setWorkspacePath('/dashboard')}
        />
      );
    }
    return <MobileReportsScreen />;
  }

  if (workspacePath === '/events') {
    if (!hasModuleAccess('events') || !pathOk) {
      return (
        <HubAccessDenied
          title="Events"
          onBack={() => setWorkspacePath('/dashboard')}
        />
      );
    }
    return <MobileEventsScreen />;
  }

  return (
    <HubAccessDenied
      title="Workspace"
      onBack={() => setWorkspacePath('/dashboard')}
    />
  );
}
