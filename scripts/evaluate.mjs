const base = process.env.MEDNEXUS_URL || "http://localhost:3000";
const useModel = !process.argv.includes("--evidence-only");
const options = { method: "POST", headers: { "Content-Type": "application/json" } };
const session = await fetch(new URL("/api/session", base), {
  ...options, body: JSON.stringify({ role: "clinician" }), signal: AbortSignal.timeout(10_000),
});
const cookie = session.headers.getSetCookie().find(value => value.startsWith("mednexus_demo="))?.split(";")[0];
if (!session.ok || !cookie) throw new Error(`Session failed (${session.status})`);
const response = await fetch(new URL("/api/records", base), {
  ...options, headers: { ...options.headers, Cookie: cookie },
  body: JSON.stringify({ action: "evaluate", useModel }), signal: AbortSignal.timeout(170_000),
});
if (!response.ok) throw new Error(`Benchmark failed (${response.status})`);
console.log(JSON.stringify(await response.json(), null, 2));
