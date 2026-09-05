import { useRBAC } from '../../contexts/RBACContext';
import { useSidebarDrawer } from '../../contexts/SidebarDrawerContext';
import { evalSidebarPathPermission } from '../../hooks/useSidebarFilteredMenu';
import { MenuHeaderButton } from '../../components/layout/MenuHeaderButton';
import { View, Text, Pressable } from 'react-native';
import { MobileProjectsScreen } from './screens/MobileProjectsScreen';
import { MobileTasksScreen } from './screens/MobileTasksScreen';
import { MobileTeamScreen } from './screens/MobileTeamScreen';
import { MobileTimeTrackingScreen } from './screens/MobileTimeTrackingScreen';
import { isProjectWorkspacePath } from './projectPaths';

function ProjectAccessDenied(props: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row border-b border-slate-200 bg-white px-3 py-2">
        <MenuHeaderButton />
      </View>
      <View className="flex-1 justify-center px-6">
        <Text className="text-center text-lg font-semibold text-slate-900">
          Project management
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

export function ProjectRouter() {
  const { workspacePath, setWorkspacePath } = useSidebarDrawer();
  const { hasPermission, isOwner, hasModuleAccess } = useRBAC();

  if (!isProjectWorkspacePath(workspacePath)) {
    return null;
  }

  const ok =
    hasModuleAccess('projects') &&
    evalSidebarPathPermission(workspacePath, isOwner, hasPermission);

  if (!ok) {
    return (
      <ProjectAccessDenied onBack={() => setWorkspacePath('/dashboard')} />
    );
  }

  switch (workspacePath) {
    case '/projects':
      return <MobileProjectsScreen />;
    case '/tasks':
      return <MobileTasksScreen />;
    case '/team':
      return <MobileTeamScreen />;
    case '/time-tracking':
      return <MobileTimeTrackingScreen />;
    default:
      return (
        <ProjectAccessDenied onBack={() => setWorkspacePath('/dashboard')} />
      );
  }
}
