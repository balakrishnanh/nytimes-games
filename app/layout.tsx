import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import { ScoreSyncer } from "@/components/ScoreSyncer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NYT Games Clone",
  description: "Create and play custom games",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">

      <body className={inter.className} suppressHydrationWarning={true}>
        <ScoreSyncer />
        <Navbar />
        <main className="min-h-screen bg-white">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}