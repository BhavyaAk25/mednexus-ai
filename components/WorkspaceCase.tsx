"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ArrowRight, ArrowUpRight, ChevronRight, LoaderCircle, Search, X } from "lucide-react";
import { recordDate } from "../lib/dates";
import { scenarios } from "../lib/scenarios";
import type { Answer, CaseRecord, Fact, Patient, Role, Scenario, Source } from "../lib/types";
import { requestJson } from "../lib/client";
import { ChartIcon, type ChartIconName } from "./ChartIcon";
import { PatientAvatar } from "./PatientAvatar";

const tabs = [
  { label: "Summary", icon: "brief" },
  { label: "Timeline", icon: "timeline" },
  { label: "Source records", icon: "sources" },
] as const;
type Tab = typeof tabs[number]["label"];

const sourceIcons: Record<Source["format"], ChartIconName> = {
  CSV: "table", PDF: "brief", PNG: "scan", TXT: "brief",
};

function SourceDialog({ source, highlight, onClose }: { source: Source; highlight?: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const original = `/api/sources/${source.id}`;
  return <dialog ref={dialog} className="source-dialog" aria-labelledby="source-title"
    onClose={onClose} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <section className="source-sheet">
      <div className="source-top"><span className="meta-label section-kicker">SOURCE RECORD · {source.id}</span>
        <button className="icon-button" aria-label="Close source record" onClick={() => dialog.current?.close()}><X size={19} /></button>
      </div>
      <h2 id="source-title">{source.title}</h2>
      <p className="document-byline">{source.facility} · {recordDate(source.date)}</p>
      <a className="button button-outline original-link" href={original} download={`${source.id}.${source.format.toLowerCase()}`}>
        <ArrowDownToLine size={15} /> Download source · {source.format}
      </a>
      {source.format === "PNG" && <>
        {/* This protected fixture is served through the signed session. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="scanned-preview" src={original} alt="Synthetic intake note scan. The reviewed transcription follows." />
      </>}
      <div className="source-passage">
        <p className="meta-label section-kicker">{source.format === "PNG" ? "REVIEWED TRANSCRIPTION" : "INDEXED SOURCE PASSAGES"}</p>
        {source.facts.map(fact => <p key={fact.id} className={fact.id === highlight ? "highlighted-fact" : ""}>
          <span>{fact.kind}{fact.id === highlight ? " · Cited passage" : ""}</span>{fact.text}
        </p>)}
      </div>
    </section>
  </dialog>;
}

export default function WorkspaceCase({
  patient, role, requestedSource, clearRequestedSource,
}: {
  patient: Patient;
  role: Role;
  requestedSource?: string;
  clearRequestedSource: () => void;
}) {
  const [record, setRecord] = useState<(CaseRecord & { answer: Answer }) | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [tab, setTab] = useState<Tab>(requestedSource ? "Source records" : "Summary");
  const [scenario, setScenario] = useState<Scenario>("overview");
  const [question, setQuestion] = useState("");
  const [selectedSource, setSource] = useState<{ document: Source; fact?: string } | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"review" | "answer" | null>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    requestJson<CaseRecord & { answer: Answer }>(`/api/records?id=${encodeURIComponent(patient.id)}`, { signal: controller.signal })
      .then(data => { setRecord(data); setAnswer(data.answer); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => { controller.abort(); request.current?.abort(); };
  }, [patient.id]);

  const sources = record?.sources ?? [];
  const sourceMap = new Map(sources.map(document => [document.id, document]));
  const linkedDocument = requestedSource ? sourceMap.get(requestedSource) : undefined;
  const source = selectedSource ?? (linkedDocument && { document: linkedDocument, fact: undefined });

  function openFact(fact: Fact) {
    const document = sourceMap.get(fact.documentId);
    if (document) setSource({ document, fact: fact.id });
  }

  async function update(action: "review" | "answer") {
    if (busy) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(action);
    setError("");
    try {
      if (action === "review") {
        const data = await requestJson<{ reviewed: boolean }>("/api/records", {
          method: "POST", signal: controller.signal,
          body: JSON.stringify({ id: patient.id, action, value: !record?.reviewed }),
        });
        setRecord(current => current && ({ ...current, reviewed: data.reviewed }));
      } else {
        const data = await requestJson<Answer>("/api/records", {
          method: "POST", signal: controller.signal,
          body: JSON.stringify({ id: patient.id, action: "summarize", scenario, question }),
        });
        setAnswer(data);
        setHasGenerated(true);
      }
    } catch (err) { if (!controller.signal.aborted) setError((err as Error).message); }
    finally { if (!controller.signal.aborted) setBusy(null); }
  }

  const discrepancyCount = record?.answer.flags.length ?? 0;
  return <article className="case-view" aria-labelledby="patient-name">
    <div className="breadcrumb"><span>Patient records</span><ChevronRight size={13} /><span className="meta-label">{patient.id}</span></div>
    <header className="patient-header">
      <div className="patient-heading">
        <PatientAvatar patient={patient} large />
        <div><h1 id="patient-name">{patient.name}</h1><p>{patient.age} years <span>·</span> {patient.clinic}</p></div>
      </div>
      <div className="case-actions">
        {record?.reviewed ? <span className="verification-status is-verified" role="status"><ChartIcon name="verified" size={16} /> Verified in this browser</span> :
          <span className="verification-status" role="status"><ChartIcon name="pending" size={16} /> Verification pending</span>}
        {role === "clinician" && record && <button className="button button-outline review-button" onClick={() => update("review")} disabled={!!busy}>
          {busy === "review" ? <LoaderCircle size={15} className="spinner" /> : <ChartIcon name={record.reviewed ? "undo" : "confirm"} size={16} />} {record.reviewed ? "Undo verification" : "Mark verified"}
        </button>}
      </div>
    </header>
    <div className="visit-band">
      <div><span className="meta-label">REVIEW REASON</span><strong>{patient.reason}</strong></div>
      <div><span className="meta-label">REVIEW DATE</span><strong>{recordDate(patient.visit)}</strong></div>
      <div><span className="meta-label">SOURCE RECORDS</span><strong>{record ? sources.length : "…"}</strong></div>
    </div>

    <nav aria-label="Patient record sections" className="record-tabs">
      {tabs.map(({ label, icon }) => <button type="button" key={label} className="record-tab"
        aria-current={tab === label ? "page" : undefined} onClick={() => setTab(label)}>
        <ChartIcon name={icon} size={17} /><span>{label}</span>{icon === "sources" && record ? <small>{sources.length}</small> : null}
      </button>)}
    </nav>

    {error && <p className="error-note" role="alert">{error}</p>}
    {!record && !error && <p className="loading-state" role="status"><LoaderCircle size={18} className="spinner" /> Loading patient records…</p>}

    {record && answer && tab === "Summary" && <>
      <section className="analysis-form" aria-label="Generate an evidence brief">
        <form onSubmit={event => { event.preventDefault(); void update("answer"); }}>
          <label><span>Review focus</span>
            <select value={scenario} onChange={event => setScenario(event.target.value as Scenario)} disabled={!!busy}>
              {Object.entries(scenarios).map(([key, item]) => <option value={key} key={key}>{item.label}</option>)}
            </select>
          </label>
          <label className="question-field"><span>Ask about this chart <small>Optional</small></span>
            <span className="question-input"><Search size={16} /><input value={question} maxLength={240} onChange={event => setQuestion(event.target.value)} placeholder="e.g. What was the latest potassium result?" disabled={!!busy} /></span>
          </label>
          <button className="button button-green" type="submit" disabled={!!busy}>{busy === "answer" ? <><LoaderCircle size={15} className="spinner" /> Reviewing…</> : <>Generate brief <ArrowRight size={16} /></>}</button>
        </form>
      </section>
      <div className="summary-grid">
        <section className="panel evidence-panel" aria-labelledby="brief-title" aria-busy={busy === "answer"}>
          <div className="panel-heading"><div className="panel-icon"><ChartIcon name="evidence" size={22} /></div><div><h2 id="brief-title">Visit brief</h2>
            <p>{hasGenerated ? `${answer.generation} · ${answer.retrieval} · ${answer.latency >= 1000 ? (answer.latency / 1000).toFixed(1) + " s" : answer.latency + " ms"}` : "Chart overview · Source excerpts"}</p></div></div>
          {!answer.findings.length && <p className="panel-empty">No matching passages were retrieved. Try a medication, result, or follow-up mentioned in the chart.</p>}
          <ul className="evidence-list">
            {answer.findings.map(fact => <li key={fact.id}>
              <div className="fact-kind">{fact.kind}</div>
              <div><p>{fact.text}</p><button className="citation" onClick={() => openFact(fact)} aria-label={`Open source ${fact.documentId} for ${fact.kind}: ${fact.text}`}><ChartIcon name="brief" size={13} /> {fact.documentId} <ArrowUpRight size={11} /></button></div>
            </li>)}
          </ul>
          {hasGenerated && answer.contextIds.length > 0 && <details className="context-detail">
            <summary>Retrieved evidence · {answer.contextIds.length} passages</summary>
            <div>{answer.contextIds.map(id => {
              const fact = sourceMap.get(id.split(".")[0])?.facts.find(item => item.id === id);
              return fact && <button key={id} className="citation" onClick={() => openFact(fact)}>{id}<ArrowUpRight size={11} /></button>;
            })}</div>
          </details>}
          <p className="panel-foot"><ChartIcon name="verified" size={16} /> Verify against the original records.</p>
        </section>
        <section className="panel flags-panel" aria-labelledby="flags-title">
          <div className="panel-heading"><div className="panel-icon panel-icon-rust"><ChartIcon name="review" size={22} /></div><div>
            <h2 id="flags-title">Needs review</h2><p>{hasGenerated ? `${answer.flags.length} in this brief` : `${discrepancyCount} in the chart`}</p>
          </div></div>
          {!answer.flags.length && <p className="panel-empty">No items flagged.</p>}
          {answer.flags.map((flag, index) => <article className={`flag flag-${flag.severity}`} key={`${flag.title}-${index}`}>
            <p className="meta-label">{flag.severity === "conflict" ? "MEDICATION DISCREPANCY" : "DOCUMENTATION GAP"}</p>
            <h3>{flag.title}</h3><p>{flag.detail}</p>
            <div className="flag-citations">{flag.facts.map(fact => <button className="citation" key={fact.id} onClick={() => openFact(fact)}><ChartIcon name="brief" size={13} /> {fact.documentId} <ArrowUpRight size={11} /></button>)}</div>
          </article>)}
        </section>
      </div>
    </>}

    {record && tab === "Timeline" && <section className="panel timeline" aria-labelledby="timeline-heading">
      <div className="panel-heading"><div className="panel-icon"><ChartIcon name="timeline" size={22} /></div><div><h2 id="timeline-heading">Chart timeline</h2></div></div>
      <ol>
        {sources.map(document => <li key={document.id}><time dateTime={document.date}>{recordDate(document.date, false)}</time><div>
          <span className="meta-label section-kicker">{document.type}</span>
          <button className="timeline-source" onClick={() => setSource({ document })}>{document.title} <ArrowUpRight size={14} /></button>
          <p>{document.facility}</p>
          <ul>{document.facts.map(fact => <li key={fact.id}>{fact.text}</li>)}</ul>
        </div></li>)}
      </ol>
    </section>}

    {record && tab === "Source records" && <section className="panel documents" aria-labelledby="sources-heading">
      <div className="panel-heading"><div className="panel-icon"><ChartIcon name="sources" size={22} /></div><div><h2 id="sources-heading">Source records</h2></div></div>
      {sources.map(document => <button className="document-row" key={document.id} onClick={() => setSource({ document })}>
        <span className="document-icon"><ChartIcon name={sourceIcons[document.format]} size={20} /></span>
        <span><strong>{document.title}</strong><small>{document.facility} · {recordDate(document.date)}</small></span>
        <span className="format-tag">{document.format}</span><ArrowUpRight size={16} />
      </button>)}
    </section>}
    {source && <SourceDialog key={source.document.id} source={source.document} highlight={source.fact} onClose={() => { setSource(null); clearRequestedSource(); }} />}
  </article>;
}
