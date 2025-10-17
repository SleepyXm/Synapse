import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Manrope, JetBrains_Mono } from "next/font/google";
import ClientWrapper from "./ClientWrapper";
import { UserProvider } from "./handlers/UserProvider";
import AuraBackground2 from "./assets/background2";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Synapse",
  description: "Let your minds flow.",
};

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "200", "300", "500", "600"],
});

const jetbrainsmono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "200", "300", "500", "600"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${jetbrainsmono.className} antialiased`}>
        <div className="relative w-full h-full bg-gray-300/20">
        <AuraBackground2 />
        <UserProvider>
          <ClientWrapper>
            {children}
          </ClientWrapper>
        </UserProvider>
        </div>
      </body>
    </html>
  );
}