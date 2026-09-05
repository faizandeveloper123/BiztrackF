"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, Keyboard, Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import type { ProductEntryMode } from "./productCodeUtils";

type ProductCodeScannerProps = {
  mode: Exclude<ProductEntryMode, "manual">;
  scanning: boolean;
  onScan: (code: string) => void;
};

const QR_FORMATS = [Html5QrcodeSupportedFormats.QR_CODE];

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
];

export function ProductCodeScanner({
  mode,
  scanning,
  onScan,
}: ProductCodeScannerProps) {
  const reactId = useId();
  const containerId = `product-code-scanner-${reactId.replace(/:/g, "")}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) {
      setCameraActive(false);
      return;
    }
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
    } finally {
      setCameraActive(false);
    }
  }, []);

  const handleDetected = useCallback(
    (decodedText: string) => {
      const code = decodedText.trim();
      if (!code || handledRef.current || scanning) return;
      handledRef.current = true;
      void stopCamera();
      onScan(code);
    },
    [onScan, scanning, stopCamera],
  );

  const startCamera = useCallback(async () => {
    handledRef.current = false;
    setCameraError(null);
    await stopCamera();

    const scanner = new Html5Qrcode(containerId, {
      verbose: false,
      formatsToSupport: mode === "qr" ? QR_FORMATS : BARCODE_FORMATS,
    });
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.7777778,
        },
        handleDetected,
        () => {},
      );
      setCameraActive(true);
    } catch {
      setCameraError(
        "Camera access failed. Enter the code manually or allow camera permission.",
      );
      setCameraActive(false);
    }
  }, [containerId, handleDetected, mode, stopCamera]);

  useEffect(() => {
    handledRef.current = false;
    setManualCode("");
    void startCamera();
    return () => {
      void stopCamera();
    };
  }, [mode, startCamera, stopCamera]);

  useEffect(() => {
    if (!scanning) {
      handledRef.current = false;
    }
  }, [scanning]);

  const submitManualCode = () => {
    const code = manualCode.trim();
    if (!code || scanning) return;
    onScan(code);
    setManualCode("");
  };

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">
            {mode === "qr" ? "Scan QR Code" : "Scan Barcode"}
          </p>
          <p className="text-xs text-muted-foreground">
            Point your camera at the {mode === "qr" ? "QR code" : "barcode"} or
            enter the code below.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void startCamera()}
          disabled={scanning}
        >
          <Camera className="mr-2 h-4 w-4" />
          Restart Camera
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-md border bg-black">
        <div id={containerId} className="min-h-[220px] w-full" />
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="flex items-center gap-2 text-sm text-white">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading product details...
            </div>
          </div>
        )}
        {!cameraActive && !scanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 px-6 text-center text-sm text-white">
            {cameraError || "Starting camera..."}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${containerId}-manual`}>Enter code manually</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            id={`${containerId}-manual`}
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder={
              mode === "qr"
                ? "Paste QR code value..."
                : "Enter barcode number..."
            }
            disabled={scanning}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitManualCode();
              }
            }}
          />
          <Button
            type="button"
            onClick={submitManualCode}
            disabled={scanning || !manualCode.trim()}
          >
            <Keyboard className="mr-2 h-4 w-4" />
            Use Code
          </Button>
        </div>
      </div>
    </div>
  );
}
