import type { Metadata } from "next";
import AuthSwitcher from "@/components/auth-switcher";
import AppSessionProvider from "@/components/session-provider";
import SiteHeader from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "PakScorer",
  description: "Pakistan cricket operations, team management, and live scoring platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppSessionProvider>
          <div className="shell">
            <SiteHeader />
            <AuthSwitcher />
            {children}
          </div>
        </AppSessionProvider>
      </body>
    </html>
  );
}
