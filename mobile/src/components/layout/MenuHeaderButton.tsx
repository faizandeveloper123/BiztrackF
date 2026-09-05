import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSidebarDrawer } from '../../contexts/SidebarDrawerContext';

export function MenuHeaderButton() {
  const { openSidebar } = useSidebarDrawer();
  return (
    <Pressable
      className="rounded-xl border border-slate-200 bg-white p-2.5 active:bg-slate-100"
      onPress={openSidebar}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
    >
      <Ionicons name="menu-outline" size={24} color="#334155" />
    </Pressable>
  );
}
