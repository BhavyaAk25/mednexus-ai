import { reviewed, sameOrigin, session } from "../../../lib/access";
import { caseSources, patientIndex } from "../../../lib/store";
import { buildAnswer, initialAnswer } from "../../../lib/workflow";
import { isScenario } from "../../../lib/scenarios";
import { evaluate } from "../../../lib/evaluation";

export const runtime = "nodejs";
export const maxDuration = 180;

function json(payload: unknown, status = 200) {
  return Response.json(payload, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: Request) {
  const role = await session();
  if (!role) return json({ error: "Start a demo session to open records." }, 401);
  const patients = patientIndex(role);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({ role, patients });
  const patient = patients.find(item => item.id === id);
  const sources = caseSources(role, id);
  if (!patient || !sources?.length) return json({ error: "This case is unavailable in the current session." }, 404);
  return json({ patient, sources, reviewed: await reviewed(role, patient.id), answer: initialAnswer(sources) });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const role = await session();
  if (!role) return json({ error: "Start a demo session to continue." }, 401);
  if (Number(request.headers.get("content-length")) > 4096) return json({ error: "Request too large." }, 413);
  const payload = await request.json().catch(() => null);
  if (payload?.action === "evaluate") return json(await evaluate(role, payload.useModel === true));
  const id = typeof payload?.id === "string" ? payload.id : "";
  const sources = caseSources(role, id);
  if (!sources?.length) return json({ error: "This case is unavailable in the current session." }, 404);
  if (payload.action === "review") {
    if (role !== "clinician") return json({ error: "A clinician account must verify this record." }, 403);
    if (typeof payload.value !== "boolean") return json({ error: "Choose a review state." }, 400);
    return json({ reviewed: await reviewed(role, id, payload.value) });
  }
  if (payload.action !== "summarize" || !isScenario(payload.scenario)) return json({ error: "Choose a review scenario." }, 400);
  const question = typeof payload.question === "string" ? payload.question.trim() : "";
  if (question.length > 240) return json({ error: "Use 240 characters or fewer." }, 400);
  return json(await buildAnswer(sources, payload.scenario, question));
}
