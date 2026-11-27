"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LogOut, Search } from "lucide-react";
import { findCampusRecord } from "../lib/campus";
import type { Patient, Role } from "../lib/types";
import { ApiError, requestJson } from "../lib/client";
import { Brand } from "./Brand";
import { ChartIcon } from "./ChartIcon";
import { WorkspaceGlyph } from "./WorkspaceGlyph";
import { PatientAvatar } from "./PatientAvatar";
import WorkspaceCase from "./WorkspaceCase";
import Evaluation from "./Evaluation";

type View = "records" | "evaluation";
type Index = { role: Role; patients: Patient[] };
const roles = { clinician: "Clinician", coordinator: "Care coordinator" };

function WorkspaceHeader({ index, onExit }: { index?: Index | null; onExit?: () => void }) {
  return <header className="work-header">
    <div className="work-header-in">
      <Link href="/" className="text-link back-home"><ArrowLeft size={15} /> Overview</Link>
      <Brand />
      {index && <button className="button button-outline session-button" onClick={onExit} title="End review session">
        <LogOut size={14} /> Exit session
      </button>}
    </div>
  </header>;
}

export default function Workspace({ initialView, initialCase, initialSource }: { initialView: View; initialCase?: string; initialSource?: string }) {
  const [index, setIndex] = useState<Index | null | undefined>(undefined);
  const [view, setView] = useState<View>(initialView);
  const [patientId, setPatientId] = useState(initialCase || "");
  const [sourceId, setSourceId] = useState(initialSource);
  const [search, setSearch] = useState("");
  const [access, setAccess] = useState<Role | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    requestJson<Index>("/api/records", { signal: controller.signal }).then(setIndex).catch(err => {
      if (controller.signal.aborted) return;
      if (!(err instanceof ApiError) || err.status !== 401) setError(err.message);
      setIndex(null);
    });
    return () => controller.abort();
  }, []);

  const current = index?.patients.find(patient => patient.id === patientId) ?? index?.patients[0];

  const requestedSource = view === "records" && current?.id === initialCase ? sourceId : undefined;

  useEffect(() => {
    if (!current) return;
    const url = new URL(window.location.href);
    if (view === "evaluation") url.searchParams.set("view", "evaluation");
    else url.searchParams.delete("view");
    url.searchParams.set("case", current.id);
    if (requestedSource) url.searchParams.set("source", requestedSource);
    else url.searchParams.delete("source");
    window.history.replaceState(window.history.state, "", url);
  }, [current, view, requestedSource]);

  async function enter(role: Role) {
    setError("");
    setAccess(role);
    try {
      await requestJson("/api/session", { method: "POST", body: JSON.stringify({ role }) });
      setIndex(await requestJson<Index>("/api/records"));
    } catch (err) { setError((err as Error).message); }
    finally { setAccess(null); }
  }

  async function exit() {
    try {
      await requestJson("/api/session", { method: "DELETE" });
      setIndex(null);
      setView("records");
      setPatientId("");
      setSourceId(undefined);
      window.history.replaceState(window.history.state, "", "/workspace");
      setSearch("");
      setError("");
    } catch (err) { setError((err as Error).message); }
  }

  const openingRecord = !index && sourceId ? findCampusRecord(initialCase, sourceId) : undefined;

  if (!index) return <>
    <WorkspaceHeader />
    <main className="entry-main">
      {index === undefined ? <p className="loading-state" role="status">Opening the workspace…</p> :
        <section className="entry-card" aria-labelledby="entry-title">
          <div className="entry-symbol"><WorkspaceGlyph name="access" size={42} /></div>
          <h1 id="entry-title">Choose a role</h1>
          {openingRecord && <p className="entry-record">Opening <strong>{openingRecord.title}</strong></p>}
          <div className="role-actions">
            <button className="role-option" onClick={() => enter("clinician")} disabled={!!access}>
              <WorkspaceGlyph name="clinician" size={26} /><span><strong>Enter as clinician</strong><small>{access === "clinician" ? "Opening session…" : "Review and verify records"}</small></span><ArrowRight size={17} />
            </button>
            <button className="role-option" onClick={() => enter("coordinator")} disabled={!!access}>
              <WorkspaceGlyph name="coordinator" size={26} /><span><strong>Enter as care coordinator</strong><small>{access === "coordinator" ? "Opening session…" : "Review assigned records"}</small></span><ArrowRight size={17} />
            </button>
          </div>
          {error && <p className="error-note" role="alert">{error}</p>}
        </section>}
    </main>
  </>;

  const filtered = index.patients.filter(patient => `${patient.name} ${patient.id} ${patient.clinic}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <>
    <a href="#work-main" className="skip-link">Skip to review</a>
    <WorkspaceHeader index={index} onExit={exit} />
    <div className="work-layout">
      <aside className="work-sidebar" aria-label="Workspace navigation">
        <div className="sidebar-top">
          <button className="side-nav" aria-current={view === "records" ? "page" : undefined} onClick={() => setView("records")}><span className="nav-mark"><ChartIcon name="records" size={16} /></span> Patient records</button>
          <button className="side-nav" aria-current={view === "evaluation" ? "page" : undefined} onClick={() => { setSourceId(undefined); setView("evaluation"); }}><span className="nav-mark"><ChartIcon name="evaluation" size={16} /></span> Evaluation lab</button>
        </div>
        <div className="case-list">
          <div className="sidebar-heading"><p className="meta-label sidebar-label">PATIENTS</p><span>{index.patients.length}</span></div>
          <label className="patient-search"><Search size={15} /><input type="search" aria-label="Search patients" placeholder="Search name or ID" value={search} onChange={e => setSearch(e.target.value)} /></label>
          <div className="case-options">
            {filtered.map(patient => <button className="patient-option" key={patient.id}
              aria-current={view === "records" && current?.id === patient.id ? "true" : undefined} onClick={() => { setSourceId(undefined); setPatientId(patient.id); setView("records"); }}>
              <PatientAvatar patient={patient} />
              <span><strong>{patient.name}</strong><small>{patient.id}</small></span>
            </button>)}
            {!filtered.length && <p className="empty-search">No matching patients.</p>}
          </div>
        </div>
        <div className="sidebar-role"><span className="role-icon"><WorkspaceGlyph name={index.role} size={21} /></span><strong>{roles[index.role]}</strong></div>
      </aside>
      <main id="work-main" className="work-main">
        {error && <p className="error-note" role="alert">{error}</p>}
        {view === "evaluation" ? <Evaluation role={index.role} /> :
          current ? <WorkspaceCase key={current.id} patient={current} role={index.role} requestedSource={requestedSource} clearRequestedSource={() => setSourceId(undefined)} /> :
          <p className="loading-state"><ChartIcon name="records" size={19} /> No cases assigned.</p>}
      </main>
    </div>
  </>;
}
