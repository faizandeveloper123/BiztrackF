import { Alert, Linking } from 'react-native';

export async function openWebPath(path: string): Promise<void> {
  const base = process.env.EXPO_PUBLIC_WEB_APP_URL || '';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!base) {
    Alert.alert('BizTrack', `This screen opens on the web app:\n${normalized}`);
    return;
  }
  const url = `${base.replace(/\/$/, '')}${normalized}`;
  const can = await Linking.canOpenURL(url);
  if (can) {
    await Linking.openURL(url);
  } else {
    Alert.alert('BizTrack', `Cannot open URL:\n${url}`);
  }
}
