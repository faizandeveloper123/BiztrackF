import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppModal } from '../components/layout/AppModal';
import { WS } from '../features/workshop/components/workshopTheme';

type DialogState =
  | { kind: 'idle' }
  | {
      kind: 'alert';
      title: string;
      message?: string;
      buttonLabel?: string;
      onClose?: () => void;
    }
  | {
      kind: 'confirm';
      title: string;
      message?: string;
      confirmLabel?: string;
      cancelLabel?: string;
      destructive?: boolean;
      onConfirm: () => void;
      onCancel?: () => void;
    };

type AppDialogContextValue = {
  alert: (opts: {
    title: string;
    message?: string;
    buttonLabel?: string;
    onClose?: () => void;
  }) => void;
  confirm: (opts: {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }) => void;
};

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

export function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>({ kind: 'idle' });

  const close = useCallback(() => {
    setDialog({ kind: 'idle' });
  }, []);

  const alert = useCallback<AppDialogContextValue['alert']>((opts) => {
    setDialog({
      kind: 'alert',
      title: opts.title,
      message: opts.message,
      buttonLabel: opts.buttonLabel ?? 'OK',
      onClose: opts.onClose,
    });
  }, []);

  const confirm = useCallback<AppDialogContextValue['confirm']>((opts) => {
    setDialog({
      kind: 'confirm',
      title: opts.title,
      message: opts.message,
      confirmLabel: opts.confirmLabel ?? 'Confirm',
      cancelLabel: opts.cancelLabel ?? 'Cancel',
      destructive: opts.destructive,
      onConfirm: () => {
        void Promise.resolve(opts.onConfirm()).finally(() => close());
      },
      onCancel: opts.onCancel,
    });
  }, [close]);

  const value = useMemo(() => ({ alert, confirm }), [alert, confirm]);

  const visible = dialog.kind !== 'idle';
  const isConfirm = dialog.kind === 'confirm';
  const isDestructive = dialog.kind === 'confirm' && dialog.destructive;

  return (
    <AppDialogContext.Provider value={value}>
      {children}
      <AppModal visible={visible} transparent animationType="fade" onClose={close}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(15,23,42,0.55)',
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 340,
              backgroundColor: WS.card,
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: WS.border,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: isDestructive ? WS.dangerBg : WS.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'center',
                marginBottom: 16,
              }}
            >
              <Ionicons
                name={isDestructive ? 'trash-outline' : isConfirm ? 'help-circle-outline' : 'information-circle-outline'}
                size={28}
                color={isDestructive ? WS.danger : WS.primary}
              />
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: WS.text,
                textAlign: 'center',
              }}
            >
              {dialog.kind !== 'idle' ? dialog.title : ''}
            </Text>
            {dialog.kind !== 'idle' && dialog.message ? (
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 15,
                  lineHeight: 22,
                  color: WS.textMuted,
                  textAlign: 'center',
                }}
              >
                {dialog.message}
              </Text>
            ) : null}

            {dialog.kind === 'alert' ? (
              <Pressable
                onPress={() => {
                  dialog.onClose?.();
                  close();
                }}
                style={{
                  marginTop: 22,
                  borderRadius: 14,
                  backgroundColor: WS.primary,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontWeight: '700', fontSize: 16, color: '#fff' }}>
                  {dialog.buttonLabel ?? 'OK'}
                </Text>
              </Pressable>
            ) : null}

            {dialog.kind === 'confirm' ? (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
                <Pressable
                  onPress={() => {
                    dialog.onCancel?.();
                    close();
                  }}
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: WS.border,
                    paddingVertical: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontWeight: '700', color: WS.textMuted }}>
                    {dialog.cancelLabel ?? 'Cancel'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={dialog.onConfirm}
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    backgroundColor: isDestructive ? WS.danger : WS.primary,
                    paddingVertical: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontWeight: '700', color: '#fff' }}>
                    {dialog.confirmLabel ?? 'Confirm'}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </AppModal>
    </AppDialogContext.Provider>
  );
}

export function useAppDialog() {
  const ctx = useContext(AppDialogContext);
  if (!ctx) {
    throw new Error('useAppDialog must be used within AppDialogProvider');
  }
  return ctx;
}
