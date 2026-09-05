import { useEffect } from 'react';
import { useAppDialog } from '../../contexts/AppDialogContext';
import { registerAppDialog } from '../../utils/appDialog';

export function AppDialogRegistrar() {
  const dialog = useAppDialog();
  useEffect(() => {
    registerAppDialog(dialog);
    return () => registerAppDialog(null);
  }, [dialog]);
  return null;
}
