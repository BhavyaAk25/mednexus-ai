import { changeSession, isRole, sameOrigin } from "../../../lib/access";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!isRole(body?.role)) return Response.json({ error: "Choose a demo role" }, { status: 400 });
  await changeSession(body.role);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  await changeSession();
  return Response.json({ ok: true });
}
