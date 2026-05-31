import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LoanFlow — Loan Management System",
  description: "A modern loan management system for borrowers and operations teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body suppressHydrationWarning className={`${inter.className} min-h-full flex flex-col bg-slate-950 text-slate-100`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
