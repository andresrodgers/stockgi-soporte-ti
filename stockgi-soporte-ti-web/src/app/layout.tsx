import type { Metadata } from "next";
import { AppStateProvider } from "@/context/app-state";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockGI Soporte TI",
  description: "Prototipo funcional de mesa de ayuda TI StockGI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}