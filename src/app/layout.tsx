import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Antigravity",
  description: "Your personal workspace",
};

import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AuthProvider>
            <Navbar />
            <div className="pt-16">
              {children}
            </div>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
