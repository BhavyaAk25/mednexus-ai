const base = process.env.MEDNEXUS_URL || "http://localhost:3000";
const mode = process.argv.find(arg => arg.startsWith("--mode="))?.slice(7) ?? "retrieval";
const suite = process.argv.includes("--walkthrough") ? "walkthrough" : "synthea";
if (!["retrieval","groq","gemini"].includes(mode)) throw new Error("Use --mode=retrieval, groq or gemini.");
const options = { method: "POST", headers: { "Content-Type": "application/json" } };
const session = await fetch(new URL("/api/session", base), {
  ...options, body: JSON.stringify({ role: "clinician" }), signal: AbortSignal.timeout(10_000),
});
const cookie = session.headers.getSetCookie().find(value => value.startsWith("mednexus_demo="))?.split(";")[0];
if (!session.ok || !cookie) throw new Error(`Session failed (${session.status})`);
const response = await fetch(new URL("/api/records", base), {
  ...options, headers: { ...options.headers, Cookie: cookie },
  body: JSON.stringify({ action: "evaluate", mode, suite }), signal: AbortSignal.timeout(170_000),
});
if (!response.ok) throw new Error(`Benchmark failed (${response.status})`);
console.log(JSON.stringify(await response.json(), null, 2));
