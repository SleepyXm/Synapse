import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/SynapseNav";
import { UserProvider } from "./handlers/UserProvider";
import AuraBackground2 from "./assets/background2";
import { jetBrainsMono } from "./assets/fonts";


export const metadata: Metadata = {
  title: "Synapse",
  description: "Let your minds flow.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${jetBrainsMono.className} antialiased`}>
        <div className="relative w-full h-full bg-gray-300/20">
        <AuraBackground2 />
        <UserProvider>
          <Navbar />

            {children}

        </UserProvider>
        </div>
      </body>
    </html>
  );
}