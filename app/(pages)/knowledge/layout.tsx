import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Knowledge",
  description: "Create knowledge bases and manage the documents Synapse can use.",
};

export default function KnowledgeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
