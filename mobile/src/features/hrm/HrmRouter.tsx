import { useRBAC } from '../../contexts/RBACContext';
import { useSidebarDrawer } from '../../contexts/SidebarDrawerContext';
import { evalSidebarPathPermission } from '../../hooks/useSidebarFilteredMenu';
import { MenuHeaderButton } from '../../components/layout/MenuHeaderButton';
import { View, Text, Pressable } from 'react-native';
import { MobileHrmDashboardScreen } from './screens/MobileHrmDashboardScreen';
import { MobileHrmEmployeesScreen } from './screens/MobileHrmEmployeesScreen';
import { MobileHrmJobPostingsScreen } from './screens/MobileHrmJobPostingsScreen';
import { MobileHrmPerformanceReviewsScreen } from './screens/MobileHrmPerformanceReviewsScreen';
import { MobileHrmLeaveManagementScreen } from './screens/MobileHrmLeaveManagementScreen';
import { MobileHrmTrainingScreen } from './screens/MobileHrmTrainingScreen';
import { MobileHrmPayrollScreen } from './screens/MobileHrmPayrollScreen';
import { MobileHrmSuppliersScreen } from './screens/MobileHrmSuppliersScreen';
import { isHrmWorkspacePath } from './hrmPaths';

function HrmAccessDenied(props: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row border-b border-slate-200 bg-white px-3 py-2">
        <MenuHeaderButton />
      </View>
      <View className="flex-1 justify-center px-6">
        <Text className="text-center text-lg font-semibold text-slate-900">
          HRM access
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

export function HrmRouter() {
  const { workspacePath, setWorkspacePath } = useSidebarDrawer();
  const { hasPermission, isOwner, hasModuleAccess } = useRBAC();

  if (!isHrmWorkspacePath(workspacePath)) {
    return null;
  }

  const ok =
    hasModuleAccess('hrm') &&
    evalSidebarPathPermission(workspacePath, isOwner, hasPermission);

  if (!ok) {
    return (
      <HrmAccessDenied onBack={() => setWorkspacePath('/dashboard')} />
    );
  }

  switch (workspacePath) {
    case '/hrm':
      return <MobileHrmDashboardScreen />;
    case '/hrm/employees':
      return <MobileHrmEmployeesScreen />;
    case '/hrm/job-postings':
      return <MobileHrmJobPostingsScreen />;
    case '/hrm/performance-reviews':
      return <MobileHrmPerformanceReviewsScreen />;
    case '/hrm/leave-management':
      return <MobileHrmLeaveManagementScreen />;
    case '/hrm/training':
      return <MobileHrmTrainingScreen />;
    case '/hrm/payroll':
      return <MobileHrmPayrollScreen />;
    case '/hrm/suppliers':
      return <MobileHrmSuppliersScreen />;
    default:
      return <HrmAccessDenied onBack={() => setWorkspacePath('/dashboard')} />;
  }
}
