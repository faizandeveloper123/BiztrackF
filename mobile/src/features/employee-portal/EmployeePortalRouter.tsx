import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSidebarDrawer } from '../../contexts/SidebarDrawerContext';
import { useIsManagerPortal } from '../../hooks/useIsManagerPortal';
import { MenuHeaderButton } from '../../components/layout/MenuHeaderButton';
import { isEmployeePortalPath } from './employeePortalPaths';
import { MobileEmployeeProfileScreen } from './screens/MobileEmployeeProfileScreen';
import { MobileEmployeeLeaveScreen } from './screens/MobileEmployeeLeaveScreen';
import { MobileEmployeeTimeScreen } from './screens/MobileEmployeeTimeScreen';
import { MobileEmployeeTasksScreen } from './screens/MobileEmployeeTasksScreen';
import { MobileEmployeeDevicesScreen } from './screens/MobileEmployeeDevicesScreen';
import { MobileManagerApprovalsScreen } from './screens/MobileManagerApprovalsScreen';
import { MobileManagerDevicesScreen } from './screens/MobileManagerDevicesScreen';

function PortalAccessDenied(props: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row border-b border-slate-200 bg-white px-3 py-2">
        <MenuHeaderButton />
      </View>
      <View className="flex-1 justify-center px-6">
        <Text className="text-center text-lg font-semibold text-slate-900">
          Access denied
        </Text>
        <Pressable
          className="mt-6 items-center rounded-lg bg-indigo-600 py-3"
          onPress={props.onBack}
        >
          <Text className="font-semibold text-white">Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function EmployeePortalRouter() {
  const { workspacePath, setWorkspacePath, setSidebarActivePath } = useSidebarDrawer();
  const isManager = useIsManagerPortal();

  useEffect(() => {
    if (workspacePath === '/employee-portal') {
      setWorkspacePath('/dashboard');
      setSidebarActivePath('/dashboard');
    }
  }, [workspacePath, setWorkspacePath, setSidebarActivePath]);

  if (!isEmployeePortalPath(workspacePath)) {
    return null;
  }

  if (workspacePath === '/employee-portal') {
    return null;
  }

  if (workspacePath === '/employee-portal/approvals' && !isManager) {
    return <PortalAccessDenied onBack={() => setWorkspacePath('/dashboard')} />;
  }

  if (workspacePath === '/employee-portal/manage-devices' && !isManager) {
    return <PortalAccessDenied onBack={() => setWorkspacePath('/dashboard')} />;
  }

  switch (workspacePath) {
    case '/employee-portal/profile':
      return <MobileEmployeeProfileScreen />;
    case '/employee-portal/leave':
      return <MobileEmployeeLeaveScreen />;
    case '/employee-portal/time':
      return <MobileEmployeeTimeScreen />;
    case '/employee-portal/tasks':
      return <MobileEmployeeTasksScreen />;
    case '/employee-portal/devices':
      return <MobileEmployeeDevicesScreen />;
    case '/employee-portal/approvals':
      return <MobileManagerApprovalsScreen />;
    case '/employee-portal/manage-devices':
      return <MobileManagerDevicesScreen />;
    default:
      return <PortalAccessDenied onBack={() => setWorkspacePath('/dashboard')} />;
  }
}

export { isEmployeePortalPath } from './employeePortalPaths';
