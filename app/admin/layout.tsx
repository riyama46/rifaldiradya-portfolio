import type { Metadata } from "next";
import { adminStrings } from "@/components/admin/strings";
import { fontVariables } from "@/lib/fonts";
import "@/styles/globals.css";

// Separate root layout for the admin (App Flow G3): English only, no public shell, no analytics.
export const metadata: Metadata = {
  title: { default: adminStrings.appName, template: `%s · ${adminStrings.appName}` },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
