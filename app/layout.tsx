import "./globals.css";
import type { Metadata } from "next";
import Providers from "./providers";
import Header from "@/components/Header";
import UsernameModal from "@/components/UsernameModal";
import { Toaster } from "react-hot-toast";

export const meta: Metadata = {
  title: "NovaNote",
  description: "AI-powered knowledge notebook (POC)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          {children}
          <UsernameModal />
          <Toaster position="bottom-center" />
        </Providers>
      </body>
    </html>
  );
}