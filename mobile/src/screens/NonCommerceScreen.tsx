import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSidebarDrawer } from '../contexts/SidebarDrawerContext';
import { MenuHeaderButton } from '../components/layout/MenuHeaderButton';
import { WS } from '../features/workshop/components/workshopTheme';

interface NonCommerceScreenProps {
  planType: string;
}

export function NonCommerceScreen({ planType }: NonCommerceScreenProps) {
  const { logout, user } = useAuth();
  const { setSidebarActivePath, setWorkspacePath } = useSidebarDrawer();

  useEffect(() => {
    setSidebarActivePath('/dashboard');
  }, [setSidebarActivePath]);

  return (
    <View style={{ flex: 1, backgroundColor: WS.bg }}>
      <View
        style={{
          backgroundColor: WS.primary,
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 32,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        <MenuHeaderButton />
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 8 }}>
          {planType === 'workshop' ? 'Workshop' : 'Workspace'}
        </Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
          Mobile view
        </Text>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <View
          style={{
            backgroundColor: WS.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: WS.border,
            padding: 24,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: WS.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons name="phone-portrait-outline" size={30} color={WS.primary} />
          </View>
          <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: '800', color: WS.text }}>
            Screen not available
          </Text>
          <Text style={{ marginTop: 10, textAlign: 'center', fontSize: 15, color: WS.textMuted, lineHeight: 22 }}>
            This section is not set up for mobile yet. Open it from the web app or pick another item from the menu.
          </Text>
          {user?.email ? (
            <Text style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: WS.textLight }}>
              {user.email}
            </Text>
          ) : null}
          <Pressable
            onPress={() => setWorkspacePath('/dashboard')}
            style={{
              marginTop: 20,
              width: '100%',
              alignItems: 'center',
              borderRadius: 14,
              backgroundColor: WS.primary,
              paddingVertical: 14,
            }}
          >
            <Text style={{ fontWeight: '700', color: '#fff' }}>Back to dashboard</Text>
          </Pressable>
          <Pressable
            onPress={() => void logout()}
            style={{
              marginTop: 10,
              width: '100%',
              alignItems: 'center',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: WS.border,
              paddingVertical: 14,
            }}
          >
            <Text style={{ fontWeight: '600', color: WS.textMuted }}>Sign out</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
