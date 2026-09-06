import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "FIX — Forum Informasi dan eXam",
  description: "Sistem sekolah digital Rinascita",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={playfair.variable}>
      <body className="min-h-screen bg-rinas-bg text-rinas-text antialiased">
        {children}
      </body>
    </html>
  );
}
