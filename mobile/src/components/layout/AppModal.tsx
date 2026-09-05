import React, { useEffect } from 'react';
import {
  Modal,
  BackHandler,
  Platform,
  type ModalProps,
} from 'react-native';

export type AppModalProps = Omit<ModalProps, 'onRequestClose'> & {
  onClose: () => void;
};

export function AppModal({
  onClose,
  children,
  visible,
  ...props
}: AppModalProps) {
  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  return (
    <Modal {...props} visible={visible} onRequestClose={onClose}>
      {children}
    </Modal>
  );
}
