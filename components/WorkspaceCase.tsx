"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ArrowRight, ArrowUpRight, Check, ChevronRight, CircleAlert, Clock3, FileCheck2, FileText, FlaskConical, Layers3, ListTree, LoaderCircle, Search, ShieldCheck, X } from "lucide-react";
import { recordDate } from "../lib/dates";
import { scenarios } from "../lib/scenarios";
import type { Answer, CaseRecord, Fact, Patient, Role, Scenario, Source } from "../lib/types";
import { requestJson } from "../lib/client";

const tabs = ["Summary", "Timeline", "Source records"] as const;
type Tab = typeof tabs[number];

function SourceDialog({ source, highlight, onClose }: { source: Source; highlight?: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const original = `/api/sources/${source.id}`;
  return <dialog ref={dialog} className="source-dialog" aria-labelledby="source-title"
    onClose={onClose} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <section className="source-sheet">
      <div className="source-top"><span className="mono section-kicker">SOURCE RECORD · {source.id}</span>
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
        <p className="mono section-kicker">{source.format === "PNG" ? "REVIEWED TRANSCRIPTION" : "INDEXED SOURCE PASSAGES"}</p>
        {source.facts.map(fact => <p key={fact.id} className={fact.id === highlight ? "highlighted-fact" : ""}>
          <span>{fact.kind}{fact.id === highlight ? " · Cited passage" : ""}</span>{fact.text}
        </p>)}
      </div>
    </section>
  </dialog>;
}

export default function WorkspaceCase({ patient, role }: { patient: Patient; role: Role }) {
  const [record, setRecord] = useState<(CaseRecord & { answer: Answer }) | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [tab, setTab] = useState<Tab>("Summary");
  const [scenario, setScenario] = useState<Scenario>("overview");
  const [question, setQuestion] = useState("");
  const [source, setSource] = useState<{ document: Source; fact?: string } | null>(null);
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
    <div className="breadcrumb"><span>Patient records</span><ChevronRight size={13} /><span className="mono">{patient.id}</span></div>
    <header className="patient-header">
      <div className="patient-heading">
        <span className={`avatar avatar-large ${patient.tone}`} aria-hidden="true">{patient.initials}</span>
        <div><h1 id="patient-name">{patient.name}</h1><p>{patient.age} years <span>·</span> {patient.clinic}</p></div>
      </div>
      <div className="case-actions">
        {record?.reviewed ? <span className="status-pill is-verified" role="status"><ShieldCheck size={14} /> Verified in this browser</span> :
          <span className="status-pill" role="status"><Clock3 size={14} /> Verification pending</span>}
        {role === "clinician" && record && <button className="button button-outline review-button" onClick={() => update("review")} disabled={!!busy}>
          {busy === "review" ? <LoaderCircle size={15} className="spinner" /> : <Check size={15} />} {record.reviewed ? "Undo verification" : "Mark verified"}
        </button>}
      </div>
    </header>
    <div className="visit-band">
      <div><span className="mono">REVIEW REASON</span><strong>{patient.reason}</strong></div>
      <div><span className="mono">REVIEW DATE</span><strong>{recordDate(patient.visit)}</strong></div>
      <div><span className="mono">SOURCE RECORDS</span><strong>{record ? sources.length : "…"}</strong></div>
    </div>

    <nav aria-label="Patient record sections" className="record-tabs">
      {tabs.map((name, i) => {
        const Icon = [ListTree, Clock3, Layers3][i];
        return <button type="button" key={name} aria-current={tab === name ? "page" : undefined} onClick={() => setTab(name)}>
          <Icon size={16} /><span>{name}</span>{name === "Source records" && record ? <small>{sources.length}</small> : null}
        </button>;
      })}
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
          <div className="panel-heading"><div className="panel-icon"><FileCheck2 size={19} /></div><div><h2 id="brief-title">Visit brief</h2>
            <p>{hasGenerated ? `${answer.generation} · ${answer.retrieval} · ${answer.latency >= 1000 ? (answer.latency / 1000).toFixed(1) + " s" : answer.latency + " ms"}` : "Chart overview · Source excerpts"}</p></div></div>
          {!answer.findings.length && <p className="panel-empty">No matching passages were retrieved. Try a medication, result, or follow-up mentioned in the chart.</p>}
          <ul className="evidence-list">
            {answer.findings.map(fact => <li key={fact.id}>
              <div className="fact-kind">{fact.kind}</div>
              <div><p>{fact.text}</p><button className="citation" onClick={() => openFact(fact)} aria-label={`Open source ${fact.documentId} for ${fact.kind}: ${fact.text}`}><FileText size={11} /> {fact.documentId} <ArrowUpRight size={11} /></button></div>
            </li>)}
          </ul>
          {hasGenerated && answer.contextIds.length > 0 && <details className="context-detail">
            <summary>Retrieved evidence · {answer.contextIds.length} passages</summary>
            <div>{answer.contextIds.map(id => {
              const fact = sourceMap.get(id.split(".")[0])?.facts.find(item => item.id === id);
              return fact && <button key={id} className="citation" onClick={() => openFact(fact)}>{id}<ArrowUpRight size={11} /></button>;
            })}</div>
          </details>}
          <p className="panel-foot"><ShieldCheck size={15} /> Verify primary sources before relying on a generated brief.</p>
        </section>
        <section className="panel flags-panel" aria-labelledby="flags-title">
          <div className="panel-heading"><div className="panel-icon panel-icon-rust"><CircleAlert size={19} /></div><div>
            <h2 id="flags-title">Needs review</h2><p>{hasGenerated ? `${answer.flags.length} in this brief` : `${discrepancyCount} in the chart`}</p>
          </div></div>
          {!answer.flags.length && <p className="panel-empty">No discrepancy or documentation gap was flagged in this view.</p>}
          {answer.flags.map((flag, index) => <article className={`flag flag-${flag.severity}`} key={`${flag.title}-${index}`}>
            <p className="mono">{flag.severity === "conflict" ? "MEDICATION DISCREPANCY" : "DOCUMENTATION GAP"}</p>
            <h3>{flag.title}</h3><p>{flag.detail}</p>
            <div className="flag-citations">{flag.facts.map(fact => <button className="citation" key={fact.id} onClick={() => openFact(fact)}><FileText size={11} /> {fact.documentId} <ArrowUpRight size={11} /></button>)}</div>
          </article>)}
        </section>
      </div>
    </>}

    {record && tab === "Timeline" && <section className="panel timeline" aria-labelledby="timeline-heading">
      <div className="panel-heading"><div className="panel-icon"><Clock3 size={19} /></div><div><h2 id="timeline-heading">Chart timeline</h2><p>Most recent documentation first</p></div></div>
      <ol>
        {sources.map(document => <li key={document.id}><time dateTime={document.date}>{recordDate(document.date, false)}</time><div>
          <span className="mono section-kicker">{document.type}</span>
          <button className="timeline-source" onClick={() => setSource({ document })}>{document.title} <ArrowUpRight size={14} /></button>
          <p>{document.facility}</p>
          <ul>{document.facts.map(fact => <li key={fact.id}>{fact.text}</li>)}</ul>
        </div></li>)}
      </ol>
    </section>}

    {record && tab === "Source records" && <section className="panel documents" aria-labelledby="sources-heading">
      <div className="panel-heading"><div className="panel-icon"><Layers3 size={19} /></div><div><h2 id="sources-heading">Source records</h2><p>{sources.length} indexed originals</p></div></div>
      {sources.map(document => <button className="document-row" key={document.id} onClick={() => setSource({ document })}>
        <span className="document-icon">{document.format === "CSV" ? <FlaskConical size={18} /> : <FileText size={18} />}</span>
        <span><strong>{document.title}</strong><small>{document.facility} · {recordDate(document.date)}</small></span>
        <span className="format-tag mono">{document.format}</span><ArrowUpRight size={16} />
      </button>)}
    </section>}
    {source && <SourceDialog key={source.document.id} source={source.document} highlight={source.fact} onClose={() => setSource(null)} />}
  </article>;
}
