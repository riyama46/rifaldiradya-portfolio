import type { Metadata } from "next";
import "@/styles/globals.css";

// Temporary root layout; T-03 replaces it with app/[lang]/layout.tsx and app/admin/layout.tsx.
export const metadata: Metadata = {
  title: "Rifaldi Radya Pratama",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
