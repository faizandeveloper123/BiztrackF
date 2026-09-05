import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { AppModal } from '../../../../components/layout/AppModal';
import type { ProductEntryMode } from './productCodeHelpers';

type Props = {
  visible: boolean;
  mode: Exclude<ProductEntryMode, 'manual'>;
  loading: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
};

export function ProductCodeScannerModal({ visible, mode, loading, onClose, onScan }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const handledRef = useRef(false);

  useEffect(() => {
    if (visible) {
      handledRef.current = false;
      setManualCode('');
      if (!permission?.granted) {
        void requestPermission();
      }
    }
  }, [visible, permission?.granted, requestPermission]);

  const handleDetected = useCallback(
    ({ data }: { data: string }) => {
      const code = data.trim();
      if (!code || handledRef.current || loading) return;
      handledRef.current = true;
      onScan(code);
    },
    [loading, onScan],
  );

  const submitManualCode = () => {
    const code = manualCode.trim();
    if (!code || loading) return;
    handledRef.current = true;
    onScan(code);
    setManualCode('');
  };

  const barcodeTypes =
    mode === 'qr'
      ? (['qr'] as const)
      : (['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'codabar'] as const);

  return (
    <AppModal visible={visible} animationType="slide" onClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: '#e2e8f0',
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#0f172a' }}>
            {mode === 'qr' ? 'Scan QR Code' : 'Scan Barcode'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={{ flex: 1, padding: 16 }}>
          {!permission?.granted ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Ionicons name="camera-outline" size={48} color="#94a3b8" />
              <Text style={{ textAlign: 'center', color: '#64748b', paddingHorizontal: 24 }}>
                Camera permission is required to scan {mode === 'qr' ? 'QR codes' : 'barcodes'}.
              </Text>
              <Pressable
                onPress={() => void requestPermission()}
                style={{
                  backgroundColor: '#2563eb',
                  borderRadius: 10,
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Allow Camera</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={{ overflow: 'hidden', borderRadius: 12, backgroundColor: '#000', minHeight: 280 }}>
                <CameraView
                  style={{ flex: 1, minHeight: 280 }}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: [...barcodeTypes] }}
                  onBarcodeScanned={loading ? undefined : handleDetected}
                />
                {loading && (
                  <View
                    style={{
                      ...({
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                      } as const),
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.55)',
                    }}
                  >
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={{ color: '#fff', marginTop: 10 }}>Loading product details...</Text>
                  </View>
                )}
              </View>

              <Text style={{ marginTop: 16, marginBottom: 8, fontSize: 13, fontWeight: '700', color: '#475569' }}>
                Or enter code manually
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  value={manualCode}
                  onChangeText={setManualCode}
                  placeholder={mode === 'qr' ? 'Paste QR code value...' : 'Enter barcode number...'}
                  placeholderTextColor="#94a3b8"
                  editable={!loading}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: '#0f172a',
                  }}
                />
                <Pressable
                  onPress={submitManualCode}
                  disabled={loading || !manualCode.trim()}
                  style={{
                    backgroundColor: loading || !manualCode.trim() ? '#93c5fd' : '#2563eb',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Use</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </AppModal>
  );
}
