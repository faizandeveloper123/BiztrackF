import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthGuard } from "@/src/components/auth";
import { DesktopRuntimeClass } from "@/src/components/layout/DesktopRuntimeClass";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { RBACProvider } from "@/src/contexts/RBACContext";
import { CurrencyProvider } from "@/src/contexts/CurrencyContext";
import { NotificationProvider } from "@/src/contexts/NotificationContext";
import { ConfirmProvider } from "@/src/contexts/ConfirmContext";
import {
  AnalyticsNoscript,
  AnalyticsScripts,
} from "@/src/components/analytics/AnalyticsScripts";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BizTrack - Project Management System",
  description:
    "Professional project management and team collaboration platform",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/biztrack-icon.png", type: "image/png", sizes: "256x256" },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <AnalyticsNoscript />
        <AnalyticsScripts />
        <DesktopRuntimeClass />
        <AuthProvider>
          <RBACProvider>
            <CurrencyProvider>
              <NotificationProvider>
                <ConfirmProvider>
                  <AuthGuard>{children}</AuthGuard>
                  <Toaster position="top-center" richColors closeButton />
                </ConfirmProvider>
              </NotificationProvider>
            </CurrencyProvider>
          </RBACProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
