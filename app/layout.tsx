import "./globals.css";
import type { Metadata } from "next";
import Providers from "./providers";
import Header from "@/components/Header";

export const meta: Metadata = {
  title: "NovaNote",
  description: "AI-powered knowledge notebook (POC)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}