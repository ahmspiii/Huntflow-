import "./globals.css";
import { Suspense } from "react";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";
import Toast from "@/components/Toast";
import ShortcutsModal from "@/components/ShortcutsModal";

const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400"], variable: "--font-mono" });

export const metadata = {
  title: "HuntFlow — Threat Hunting Workflow",
  description: "Threat hunting workflow management platform by Ahmed Alaa",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} dark`}>
      <body className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] p-4 md:p-8 animate-fade-in">
            {children}
          </div>
          <CommandPalette />
          <ShortcutsModal />
          <Suspense fallback={null}>
            <Toast />
          </Suspense>
          {/* Footer */}
          <footer className="border-t border-line/40 mt-12">
            <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted">
                <svg className="w-4 h-4 text-steel" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <span>Built by <span className="text-steel font-semibold">Ahmed Alaa</span></span>
              </div>
              <div className="text-xs text-muted/60">
                HuntFlow — Threat Hunting Workflow Platform
              </div>
            </div>
          </footer>
        </main>
      </body>
    </html>
  );
}
