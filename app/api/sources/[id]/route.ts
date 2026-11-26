import { readFile } from "node:fs/promises";
import path from "node:path";
import { session } from "../../../../lib/access";
import { getSource } from "../../../../lib/store";

const mime = { TXT: "text/plain; charset=utf-8", CSV: "text/csv; charset=utf-8", PDF: "application/pdf", PNG: "image/png" };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const role = await session();
  if (!role) return new Response("Start a demo session first.", { status: 401 });
  const { id } = await params;
  const source = getSource(role, id);
  if (!source) return new Response("Source unavailable.", { status: 404 });
  const file = `${source.id}.${source.format.toLowerCase()}`;
  const content = await readFile(path.join(process.cwd(), "data", "originals", file));
  return new Response(new Uint8Array(content), { headers: {
    "Content-Type": mime[source.format],
    "Content-Disposition": `inline; filename="${file}"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  } });
}
