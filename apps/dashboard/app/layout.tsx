import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import { Sidebar } from "@/components/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Website Modernizer Dashboard",
  description: "Redesign automation control center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-transparent">
              <div className="p-8">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
