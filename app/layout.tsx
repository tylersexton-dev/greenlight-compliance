import type { Metadata } from "next";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Greenlight — Compliance Copilot",
  description: "Pre-flight compliance review for financial advisor marketing content under FINRA Rule 2210.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col" style={{ backgroundColor: "var(--color-bg)" }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
