import type { Metadata } from "next";
import Workspace from "../../components/Workspace";

export const metadata: Metadata = { title: "Review workspace" };

export default async function WorkspacePage({ searchParams }: { searchParams: Promise<{ view?: string; case?: string }> }) {
  const options = await searchParams;
  return <Workspace initialView={options.view === "evaluation" ? "evaluation" : "records"} initialCase={options.case} />;
}
