import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Role } from "./types";

const sessionName = "mednexus_demo";
const reviewName = "mednexus_review";
const globalSession = globalThis as typeof globalThis & { mednexusLocalSecret?: string };

function sign(value: string) {
  const secret = process.env.DEMO_SESSION_SECRET ||
    (!process.env.VERCEL ? (globalSession.mednexusLocalSecret ??= randomBytes(32).toString("hex")) : "");
  if (!secret) throw new Error("DEMO_SESSION_SECRET is required on Vercel");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function decode<T>(value?: string): T | null {
  if (!value) return null;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T; } catch { return null; }
}

function encode(value: object) {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function isRole(role: unknown): role is Role {
  return role === "clinician" || role === "coordinator";
}

export async function session() {
  const jar = await cookies();
  const active = decode<{ role: Role; expires: number }>(jar.get(sessionName)?.value);
  return active && isRole(active.role) && Date.now() < active.expires ? active.role : null;
}

export async function changeSession(role?: Role) {
  const jar = await cookies();
  if (!role) return jar.delete(sessionName);
  const seconds = 8 * 60 * 60;
  jar.set(sessionName, encode({ role, expires: Date.now() + seconds * 1000 }), options(seconds));
}

function options(maxAge: number) {
  return { httpOnly: true, sameSite: "lax" as const, secure: !!process.env.VERCEL, maxAge, path: "/" };
}

export async function reviewed(role: Role, patient: string, update?: boolean) {
  const jar = await cookies();
  const list = decode<Record<string, boolean>>(jar.get(reviewName)?.value) || {};
  const key = `${role}:${patient}`;
  if (update !== undefined) {
    if (update) list[key] = true;
    else delete list[key];
    jar.set(reviewName, encode(list), options(30 * 86400));
  }
  return !!list[key];
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const target = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return new URL(origin).host === target;
  } catch { return false; }
}
