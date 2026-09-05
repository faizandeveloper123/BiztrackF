import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AppState, Text, View, DeviceEventEmitter } from 'react-native';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { flushOfflineOutbox } from '../services/offline/flushOutbox';
import { listOfflineMutations } from '../services/offline/outboxStore';

type NetworkSyncContextValue = {
  isOnline: boolean;
  pendingOffline: number;
  flushNow: () => Promise<void>;
};

const NetworkSyncContext = createContext<NetworkSyncContextValue | undefined>(
  undefined,
);

export function NetworkSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOffline, setPendingOffline] = useState(0);

  useEffect(() => {
    void listOfflineMutations().then((list) =>
      setPendingOffline(list.length),
    );
  }, []);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      'biztrack-offline-queue',
      (p: { pending?: number }) => {
        if (typeof p?.pending === 'number') {
          setPendingOffline(p.pending);
        }
      },
    );
    return () => sub.remove();
  }, []);

  const flushNow = useCallback(async () => {
    try {
      await flushOfflineOutbox();
      setPendingOffline(0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = (state: NetInfoState) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      if (!cancelled && online) {
        void flushNow();
      }
    };
    const unsub = NetInfo.addEventListener(run);
    void NetInfo.fetch().then(run);
    return () => {
      cancelled = true;
      unsub();
    };
  }, [flushNow]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' && isOnline) {
        void flushNow();
      }
    });
    return () => sub.remove();
  }, [flushNow, isOnline]);

  return (
    <NetworkSyncContext.Provider
      value={{ isOnline, pendingOffline, flushNow }}
    >
      {!isOnline ? (
        <View className="border-b border-amber-200 bg-amber-50 px-3 py-2">
          <Text className="text-center text-xs font-semibold text-amber-900">
            Offline — actions queue and sync when you are back online
          </Text>
        </View>
      ) : null}
      {isOnline && pendingOffline > 0 ? (
        <View className="border-b border-indigo-100 bg-indigo-50 px-3 py-2">
          <Text className="text-center text-xs font-medium text-indigo-900">
            {pendingOffline} pending change{pendingOffline === 1 ? '' : 's'} — syncing…
          </Text>
        </View>
      ) : null}
      {children}
    </NetworkSyncContext.Provider>
  );
}

export function useNetworkSync() {
  const ctx = useContext(NetworkSyncContext);
  if (!ctx) {
    throw new Error('useNetworkSync requires NetworkSyncProvider');
  }
  return ctx;
}
