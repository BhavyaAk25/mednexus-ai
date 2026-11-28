import type { Metadata } from "next";
import Workspace from "../../components/Workspace";

export const metadata: Metadata = { title: "Review workspace" };

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[]; case?: string | string[]; source?: string | string[] }>;
}) {
  const options = await searchParams;
  const patient = typeof options.case === "string" && /^(MN|SN)-\d{4}$/.test(options.case) ? options.case : undefined;
  const source = typeof options.source === "string" && /^(?:[A-Z]{2}-\d{2}|SN-\d{4}-[A-Z]{3}-\d{4}-\d+)$/.test(options.source) ? options.source : undefined;
  return <div className="workspace">
    <Workspace initialView={options.view === "evaluation" ? "evaluation" : "records"} initialCase={patient} initialSource={patient ? source : undefined} />
  </div>;
}
