import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { BackHandler, Platform } from 'react-native';
import { useAuth } from './AuthContext';
import { MobileSidebarModal } from '../components/layout/MobileSidebarModal';
import { openWebPath } from '../utils/openWebPath';
import { isNativeWorkspacePath } from '../navigation/nativeWorkspacePaths';

type SidebarDrawerContextValue = {
  openSidebar: () => void;
  closeSidebar: () => void;
  setSidebarActivePath: (path: string) => void;
  workspacePath: string;
  setWorkspacePath: (path: string) => void;
  navigateMenuPath: (path: string) => Promise<void>;
};

const SidebarDrawerContext = createContext<
  SidebarDrawerContextValue | undefined
>(undefined);

function WorkspaceHardwareBack() {
  const { workspacePath, setWorkspacePath } = useSidebarDrawer();
  useEffect(() => {
    if (workspacePath === '/dashboard' || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setWorkspacePath('/dashboard');
      return true;
    });
    return () => sub.remove();
  }, [workspacePath, setWorkspacePath]);
  return null;
}

export function SidebarDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);
  const [activePath, setActivePath] = useState('/dashboard');
  const [workspacePath, setWorkspacePath] = useState('/dashboard');

  const openSidebar = useCallback(() => setVisible(true), []);
  const closeSidebar = useCallback(() => setVisible(false), []);

  const setSidebarActivePath = useCallback((path: string) => {
    setActivePath(path);
    if (isNativeWorkspacePath(path)) {
      setWorkspacePath(path);
    }
  }, []);

  const navigateMenuPath = useCallback(async (path: string) => {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    if (isNativeWorkspacePath(normalized)) {
      setActivePath(normalized);
      setWorkspacePath(normalized);
      setVisible(false);
      return;
    }
    setVisible(false);
    await openWebPath(normalized);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setVisible(false);
      setActivePath('/dashboard');
      setWorkspacePath('/dashboard');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setVisible(false);
      return true;
    });
    return () => sub.remove();
  }, [visible]);

  return (
    <SidebarDrawerContext.Provider
      value={{
        openSidebar,
        closeSidebar,
        setSidebarActivePath,
        workspacePath,
        setWorkspacePath,
        navigateMenuPath,
      }}
    >
      <WorkspaceHardwareBack />
      {children}
      {isAuthenticated ? (
        <MobileSidebarModal
          visible={visible}
          onClose={closeSidebar}
          activePath={activePath}
          onNavigatePath={navigateMenuPath}
        />
      ) : null}
    </SidebarDrawerContext.Provider>
  );
}

export function useSidebarDrawer() {
  const ctx = useContext(SidebarDrawerContext);
  if (ctx === undefined) {
    throw new Error('useSidebarDrawer requires SidebarDrawerProvider');
  }
  return ctx;
}
