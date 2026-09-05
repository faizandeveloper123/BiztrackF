import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from './src/services/ApiService';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { NetworkSyncProvider } from './src/contexts/NetworkSyncContext';
import { RBACProvider } from './src/contexts/RBACContext';
import { EmployeeAccessProvider } from './src/contexts/EmployeeAccessContext';
import { SidebarDrawerProvider } from './src/contexts/SidebarDrawerContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { BizTrackLogo } from './src/components/brand/BizTrackLogo';
import { CommerceDashboardScreen } from './src/screens/CommerceDashboardScreen';
import { AppDialogProvider } from './src/contexts/AppDialogContext';
import { AppDialogRegistrar } from './src/components/layout/AppDialogRegistrar';
import { PushNotificationBridge } from './src/components/push/PushNotificationBridge';
import './src/services/push/expoPush';

function RootBody() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <BizTrackLogo size="hero" />
        <ActivityIndicator size="large" color="#4f46e5" className="mt-8" />
        <Text className="mt-3 text-slate-600">Loading…</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <AppDialogProvider>
      <AppDialogRegistrar />
      <RBACProvider>
        <EmployeeAccessProvider>
          <SidebarDrawerProvider>
            <PushNotificationBridge />
            <CommerceDashboardScreen />
          </SidebarDrawerProvider>
        </EmployeeAccessProvider>
      </RBACProvider>
    </AppDialogProvider>
  );
}

export default function App() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await apiService.hydrate();
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-slate-50">
        <StatusBar style="dark" />
        {!hydrated ? (
          <View className="flex-1 items-center justify-center bg-slate-50 px-6">
            <BizTrackLogo size="hero" />
            <ActivityIndicator size="large" color="#4f46e5" className="mt-8" />
            <Text className="mt-3 text-slate-600">Starting…</Text>
          </View>
        ) : (
          <NetworkSyncProvider>
            <AuthProvider>
              <RootBody />
            </AuthProvider>
          </NetworkSyncProvider>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
