import { View, Text, Pressable } from 'react-native';
import { useSidebarDrawer } from '../../contexts/SidebarDrawerContext';
import { useRBAC } from '../../contexts/RBACContext';
import { evalSidebarPathPermission } from '../../hooks/useSidebarFilteredMenu';
import { MenuHeaderButton } from '../../components/layout/MenuHeaderButton';
import { MobileHealthcareAppointmentsScreen } from './screens/MobileHealthcareAppointmentsScreen';
import { MobileHealthcarePatientsScreen } from './screens/MobileHealthcarePatientsScreen';
import { MobileHealthcareStaffScreen } from './screens/MobileHealthcareStaffScreen';
import { MobileHealthcareDoctorsScreen } from './screens/MobileHealthcareDoctorsScreen';
import { MobileHealthcareCalendarScreen } from './screens/MobileHealthcareCalendarScreen';
import { MobileHealthcarePatientHistoryScreen } from './screens/MobileHealthcarePatientHistoryScreen';
import { MobileHealthcareAdmittedPatientsScreen } from './screens/MobileHealthcareAdmittedPatientsScreen';
import { MobileHealthcarePaymentsScreen } from './screens/MobileHealthcarePaymentsScreen';
import { MobileHealthcareDailyExpenseScreen } from './screens/MobileHealthcareDailyExpenseScreen';

function HealthcareAccessDenied(props: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row border-b border-slate-200 bg-white px-3 py-2">
        <MenuHeaderButton />
      </View>
      <View className="flex-1 justify-center px-6">
        <Text className="text-center text-lg font-semibold text-slate-900">
          Healthcare access
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

export function HealthcareRouter() {
  const { workspacePath, setWorkspacePath } = useSidebarDrawer();
  const { hasPermission, isOwner, hasModuleAccess } = useRBAC();

  if (!isHealthcareWorkspacePath(workspacePath)) {
    return null;
  }

  const ok =
    hasModuleAccess('healthcare') &&
    evalSidebarPathPermission(workspacePath, isOwner, hasPermission);

  if (!ok) {
    return (
      <HealthcareAccessDenied onBack={() => setWorkspacePath('/dashboard')} />
    );
  }

  switch (workspacePath) {
    case '/healthcare/appointments':
      return <MobileHealthcareAppointmentsScreen />;
    case '/healthcare/patients':
      return <MobileHealthcarePatientsScreen />;
    case '/healthcare/staff':
      return <MobileHealthcareStaffScreen />;
    case '/healthcare/doctors':
      return <MobileHealthcareDoctorsScreen />;
    case '/healthcare/calendar':
      return <MobileHealthcareCalendarScreen />;
    case '/healthcare/patient-history':
      return <MobileHealthcarePatientHistoryScreen />;
    case '/healthcare/admitted-patients':
      return <MobileHealthcareAdmittedPatientsScreen />;
    case '/healthcare/payments':
      return <MobileHealthcarePaymentsScreen />;
    case '/healthcare/daily-expense':
      return <MobileHealthcareDailyExpenseScreen />;
    default:
      return <HealthcareAccessDenied onBack={() => setWorkspacePath('/dashboard')} />;
  }
}

export function isHealthcareWorkspacePath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return n.startsWith('/healthcare/');
}
