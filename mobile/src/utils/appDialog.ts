import { Alert } from 'react-native';

type DialogBridge = {
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

let bridge: DialogBridge | null = null;

export function registerAppDialog(b: DialogBridge | null) {
  bridge = b;
}

export function appAlert(title: string, message?: string, onClose?: () => void) {
  if (bridge) {
    bridge.alert({ title, message, onClose });
    return;
  }
  Alert.alert(title, message, [{ text: 'OK', onPress: onClose }]);
}

export function appConfirm(opts: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}) {
  if (bridge) {
    bridge.confirm(opts);
    return;
  }
  Alert.alert(opts.title, opts.message, [
    { text: opts.cancelLabel ?? 'Cancel', style: 'cancel', onPress: opts.onCancel },
    {
      text: opts.confirmLabel ?? 'Confirm',
      style: opts.destructive ? 'destructive' : 'default',
      onPress: () => void opts.onConfirm(),
    },
  ]);
}

export function appError(title: string, message: string) {
  appAlert(title, message);
}
