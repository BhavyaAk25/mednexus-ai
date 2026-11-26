"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ChevronRight, LoaderCircle, Play } from "lucide-react";
import archive from "../data/evaluation-run.json";
import { requestJson } from "../lib/client";
import { ChartIcon } from "./ChartIcon";
import type { Role } from "../lib/types";
import type { evaluate } from "../lib/evaluation";

type Report = Awaited<ReturnType<typeof evaluate>>;
type Score = Report["rows"][number]["baseline"];
const percent = (part: number, full: number) => full ? `${Math.round(part / full * 100)}%` : "—";
const duration = (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${value} ms`;

function tally(scores: Score[]) {
  return scores.reduce((acc, score) => ({
    criticalFound: acc.criticalFound + score.criticalFound, criticalTotal: acc.criticalTotal + score.criticalTotal,
    correctCitations: acc.correctCitations + score.correctCitations, citations: acc.citations + score.citations,
    conflictsFound: acc.conflictsFound + score.conflictsFound, conflictsTotal: acc.conflictsTotal + score.conflictsTotal,
    unsupported: acc.unsupported + score.unsupported, falseFlags: acc.falseFlags + score.falseFlags,
    latency: acc.latency + score.latency,
  }), { criticalFound: 0, criticalTotal: 0, correctCitations: 0, citations: 0,
    conflictsFound: 0, conflictsTotal: 0, unsupported: 0, falseFlags: 0, latency: 0 });
}

export default function Evaluation({ role }: { role: Role }) {
  const archived = role === "clinician" && archive.rows.length ? archive as Report : null;
  const [report, setReport] = useState<Report | null>(archived);
  const [mode, setMode] = useState<"retrieval" | "model">("retrieval");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [label, setLabel] = useState(archived ? "Recorded local Ollama run" : "");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  async function run() {
    const controller = new AbortController();
    request.current = controller;
    setRunning(true);
    setError("");
    try {
      const data = await requestJson<Report>("/api/records", {
        method: "POST", signal: controller.signal, body: JSON.stringify({ action: "evaluate", useModel: mode === "model" }),
      });
      setReport(data);
      const scores = data.rows.flatMap(row => [row.baseline, row.rag]);
      const generations = scores.filter(score => score.generation === "Qwen via Ollama").length;
      setLabel(generations === scores.length ? "Live Ollama run" : generations > 0 ? "Live run with model and evidence extracts" : "Live evidence-extraction run");
    } catch (err) { if (!controller.signal.aborted) setError((err as Error).message); }
    finally { if (!controller.signal.aborted) setRunning(false); }
  }

  function download() {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mednexus-evaluation.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const before = tally(report?.rows.map(row => row.baseline) || []);
  const after = tally(report?.rows.map(row => row.rag) || []);
  const measures = [
    { label: "Critical fact recall", base: percent(before.criticalFound, before.criticalTotal), rag: percent(after.criticalFound, after.criticalTotal), sample: `${after.criticalFound}/${after.criticalTotal} expected facts`, target: "Pilot target ≥99%" },
    { label: "Citation accuracy", base: percent(before.correctCitations, before.citations), rag: percent(after.correctCitations, after.citations), sample: `${after.correctCitations}/${after.citations} source links`, target: "Pilot target ≥95%" },
    { label: "Medication discrepancies", base: percent(before.conflictsFound, before.conflictsTotal), rag: percent(after.conflictsFound, after.conflictsTotal), sample: `${after.conflictsFound}/${after.conflictsTotal} seeded conflicts`, target: "Pilot target ≥90%" },
    { label: "Mean processing latency", base: duration(Math.round(before.latency / (report?.rows.length || 1))), rag: duration(Math.round(after.latency / (report?.rows.length || 1))), sample: "Server time per case", target: "Measured separately from review time" },
  ];

  return <article className="eval-view">
    <div className="breadcrumb"><span>Workspace</span><ChevronRight size={13} /><span>Evaluation lab</span></div>
    <header className="eval-intro"><h1>Evaluation lab</h1>
      <p>Compare a single record with retrieval across the chart.</p>
    </header>
    <section className="panel eval-controls" aria-label="Benchmark controls">
      <div className="eval-control-heading"><span className="panel-icon"><ChartIcon name="lab" size={20} /></span><div><h2>Run the benchmark</h2><p>{role === "clinician" ? "3 labeled cases · 10 critical facts · 2 medication conflicts" : "2 cases assigned to this demo role"}</p></div></div>
      <div className="eval-actions">
        <label className="eval-mode"><span>Processing mode</span><select aria-label="Processing mode" value={mode} onChange={event => setMode(event.target.value as typeof mode)} disabled={running}>
          <option value="retrieval">Evidence extraction</option><option value="model">Use Ollama if available</option>
        </select></label>
        <button className="button button-green" onClick={run} disabled={running}>{running ? <LoaderCircle size={15} className="spinner" /> : <Play size={15} />} {running ? "Running…" : "Run comparison"}</button>
      </div>
    </section>
    {error && <p className="error-note" role="alert">{error}</p>}
    {running && <p className="loading-state" role="status">Scoring the assigned cases. Local model runs can take longer.</p>}
    {report && <>
      <div className="eval-result-heading"><div><span className="meta-label section-kicker">{label.toUpperCase()}</span><h2>Results</h2></div>
        <button className="button button-outline" onClick={download}><ArrowDownToLine size={15} /> Export results</button>
      </div>
      <div className="metric-grid">
        {measures.map(measure => <section className="panel metric" key={measure.label}><h3>{measure.label}</h3>
          <div><strong>{measure.rag}</strong><span>{measure.sample}</span></div>
          <p>Baseline {measure.base}</p><small>{measure.target}</small>
        </section>)}
      </div>
      <section className="panel eval-details">
        <div className="panel-heading"><span className="panel-icon"><ChartIcon name="evaluation" size={19} /></span><div><h2>Case results</h2></div></div>
        {report.rows.map(row => <details key={row.id} className="eval-case">
          <summary><span><strong>{row.title}</strong><small className="meta-label">{row.id}</small></span><span>{row.baseline.criticalFound}/{row.baseline.criticalTotal} → {row.rag.criticalFound}/{row.rag.criticalTotal} facts</span><ChevronRight size={17} /></summary>
          <div className="eval-case-body">
            {([["Baseline", row.baseline], ["With retrieval", row.rag]] as const).map(([method, score]) => <div key={method}>
              <h3>{method}</h3><p>{score.generation}{method !== "Baseline" ? ` · ${score.retrieval}` : " · First document"} · {duration(score.latency)}</p>
              <p>Citations {score.correctCitations}/{score.citations} · Conflicts {score.conflictsFound}/{score.conflictsTotal} · Unsupported {score.unsupported} · False flags {score.falseFlags}</p>
              <p className="meta-label evidence-identifiers">{score.evidence.join(" · ") || "No evidence"} </p>
            </div>)}
            <p className="expected-cases">Gold critical facts <span className="meta-label">{row.expected.join(" · ")}</span></p>
          </div>
        </details>)}
      </section>
    </>}
    <section className="evaluation-method">
      <div><ChartIcon name="verify" size={18} /><div><h3>How it was scored</h3><p>Recall counts expected facts. Citation accuracy matches excerpts to their sources. Conflict detection checks the expected medication record pairs.</p></div></div>
      <div><ChartIcon name="timeline" size={18} /><div><h3>How to interpret the results</h3><p>Timing covers server processing. The 50% staff review-time target and clinician usability still need a human study.</p></div></div>
    </section>
  </article>;
}
