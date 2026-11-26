"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BarChart3, ClipboardList, FolderOpen, LockKeyhole, LogOut, Search, ShieldCheck, Stethoscope, Users } from "lucide-react";
import type { Patient, Role } from "../lib/types";
import { ApiError, requestJson } from "../lib/client";
import { Brand } from "./Brand";
import WorkspaceCase from "./WorkspaceCase";
import Evaluation from "./Evaluation";

type View = "records" | "evaluation";
type Index = { role: Role; patients: Patient[] };
const roles = { clinician: "Clinician", coordinator: "Care coordinator" };

function WorkspaceHeader({ index, onExit }: { index?: Index | null; onExit?: () => void }) {
  return <header className="work-header">
    <div className="work-header-in">
      <Brand />
      <div className="work-header-end">
        <span className="demo-chip"><span className="signal-dot" /> Synthetic demo</span>
        {index ? <button className="button button-outline session-button" onClick={onExit} title="End demo session">
          <LogOut size={14} /> <span>Exit demo</span>
        </button> : <Link href="/" className="text-link back-home"><ArrowLeft size={15} /> Overview</Link>}
      </div>
    </div>
  </header>;
}

export default function Workspace({ initialView, initialCase }: { initialView: View; initialCase?: string }) {
  const [index, setIndex] = useState<Index | null | undefined>(undefined);
  const [view, setView] = useState<View>(initialView);
  const [patientId, setPatientId] = useState(initialCase || "");
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

  useEffect(() => {
    if (!current) return;
    const url = new URL(window.location.href);
    if (view === "evaluation") url.searchParams.set("view", "evaluation");
    else url.searchParams.delete("view");
    url.searchParams.set("case", current.id);
    window.history.replaceState(window.history.state, "", url);
  }, [current, view]);

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
      window.history.replaceState(window.history.state, "", "/workspace");
      setSearch("");
      setError("");
    } catch (err) { setError((err as Error).message); }
  }

  if (!index) return <>
    <WorkspaceHeader />
    <main className="entry-main">
      {index === undefined ? <p className="loading-state" role="status">Opening the workspace…</p> :
        <section className="entry-card" aria-labelledby="entry-title">
          <div className="entry-icon"><LockKeyhole size={21} strokeWidth={1.65} /></div>
          <p className="mono section-kicker">{view === "evaluation" ? "EVALUATION WORKSPACE" : "PATIENT RECORD WORKSPACE"}</p>
          <h1 id="entry-title">Choose a demo role.</h1>
          <p className="entry-description">Explore fictional charts in either role. Clinicians can verify all three cases. Care coordinators can review two assigned cases.</p>
          <div className="role-actions">
            <button className="role-option" onClick={() => enter("clinician")} disabled={!!access}>
              <Stethoscope size={22} /><span><strong>Enter as clinician</strong><small>{access === "clinician" ? "Opening session…" : "Review and verify records"}</small></span><ArrowRight size={17} />
            </button>
            <button className="role-option" onClick={() => enter("coordinator")} disabled={!!access}>
              <Users size={22} /><span><strong>Enter as care coordinator</strong><small>{access === "coordinator" ? "Opening session…" : "Review assigned records"}</small></span><ArrowRight size={17} />
            </button>
          </div>
          {error && <p className="error-note" role="alert">{error}</p>}
          <p className="entry-note"><ShieldCheck size={15} /> Course simulation with synthetic data</p>
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
          <p className="mono sidebar-label">WORKSPACE</p>
          <button className="side-nav" aria-current={view === "records" ? "page" : undefined} onClick={() => setView("records")}><FolderOpen size={17} /> Patient records</button>
          <button className="side-nav" aria-current={view === "evaluation" ? "page" : undefined} onClick={() => setView("evaluation")}><BarChart3 size={17} /> Evaluation lab</button>
        </div>
        <div className="case-list">
          <div className="sidebar-heading"><p className="mono sidebar-label">PATIENTS</p><span>{index.patients.length}</span></div>
          <label className="patient-search"><Search size={15} /><input type="search" aria-label="Search patients" placeholder="Search name or ID" value={search} onChange={e => setSearch(e.target.value)} /></label>
          <div className="case-options">
            {filtered.map(patient => <button className="patient-option" key={patient.id}
              aria-current={view === "records" && current?.id === patient.id ? "true" : undefined} onClick={() => { setPatientId(patient.id); setView("records"); }}>
              <span className={`avatar ${patient.tone}`}>{patient.initials}</span>
              <span><strong>{patient.name}</strong><small>{patient.id}</small></span>
            </button>)}
            {!filtered.length && <p className="empty-search">No matching patients.</p>}
          </div>
        </div>
        <div className="sidebar-role"><span className="role-icon"><ShieldCheck size={16} /></span><div><strong>{roles[index.role]}</strong><small>Demo permissions</small></div></div>
      </aside>
      <main id="work-main" className="work-main">
        {error && <p className="error-note" role="alert">{error}</p>}
        {view === "evaluation" ? <Evaluation role={index.role} /> :
          current ? <WorkspaceCase key={current.id} patient={current} role={index.role} /> :
          <p className="loading-state"><ClipboardList size={19} /> No cases assigned.</p>}
      </main>
    </div>
  </>;
}
