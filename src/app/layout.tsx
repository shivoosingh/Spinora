import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { OrganizationSchema, WebsiteSchema } from "@/lib/seo/json-ld";
import { homeMetadata } from "@/lib/seo/metadata";
import { ChatWidgetLoader } from "@/components/chat/chat-widget-loader";
import { MessageRealtimeProvider } from "@/components/chat/message-realtime-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = homeMetadata;

export const viewport: Viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <OrganizationSchema />
        <WebsiteSchema />
        <link rel="icon" href="/logo.jpeg" />
      </head>
      <body className={inter.className}>
        <MessageRealtimeProvider>
          {children}
          <ChatWidgetLoader />
        </MessageRealtimeProvider>
        <Toaster theme="dark" position="top-right" richColors />
      </body>
    </html>
  );
}
