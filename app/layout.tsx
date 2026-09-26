import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/SynapseNav";
import { UserProvider } from "@/app/components/provider/UserProvider";
import NeuralGridBackground from "./UI/NeuralGridBackground";
import { jetBrainsMono } from "./assets/fonts";


export const metadata: Metadata = {
  title: {
    default: "Synapse",
    template: "%s | Synapse",
  },
  description: "Let your minds flow.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${jetBrainsMono.className} antialiased`}>
        <div className="relative isolate min-h-screen w-full bg-gray-200/50">
          <NeuralGridBackground />
          <UserProvider>
            <Navbar />
            {children}
          </UserProvider>
        </div>
      </body>
    </html>
  );
}
