import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your Synapse account and model access.",
};

export default function ProfileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
