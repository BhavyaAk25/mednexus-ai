import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, ClipboardList, FileSearch, GitCompareArrows } from "lucide-react";
import { Brand } from "../components/Brand";
import Campus from "../components/Campus";

const workflow = [
  { title: "Find the record", copy: "Search a patient’s chart across discharge notes, specialist letters, lab exports and scanned intake forms.", icon: FileSearch },
  { title: "Compare the evidence", copy: "See where medication directions disagree and which results or follow-ups are still outstanding.", icon: GitCompareArrows },
  { title: "Verify the brief", copy: "Open the source behind any finding and mark verification after reviewing the original record.", icon: ClipboardList },
];

export default function Home() {
  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="site-header shell">
      <Brand />
      <nav aria-label="Primary navigation">
        <a href="#workflow">Workflow</a>
        <Link href="/workspace?view=evaluation">Evaluation</Link>
      </nav>
      <Link className="button button-outline header-action" href="/workspace">Open workspace <ArrowUpRight size={16} /></Link>
    </header>

    <main id="main">
      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero-content">
          <div className="hero-kicker mono"><span /> PATIENT RECORD INTELLIGENCE</div>
          <h1 id="hero-title">Every record.<br /><em>One clear view.</em></h1>
          <p>Review a patient’s notes, lab results, and medication lists in one place. Follow each finding back to the record it came from.</p>
          <div className="hero-actions">
            <Link href="/workspace" className="button button-green">Open the workspace <ArrowRight size={18} /></Link>
            <a href="#workflow" className="text-link">See how it works <ArrowDown size={14} /></a>
          </div>
          <div className="hero-note"><span /> Course prototype · Synthetic records</div>
        </div>
        <Campus />
      </section>
      <section className="workflow shell" id="workflow" aria-labelledby="workflow-title">
        <div className="workflow-title">
          <div><p className="mono section-kicker">THE REVIEW WORKFLOW</p><h2 id="workflow-title">From scattered records to a visit brief.</h2></div>
          <Link href="/workspace?view=evaluation" className="text-link">View the evaluation <ArrowUpRight size={15} /></Link>
        </div>
        <div className="workflow-grid">
          {workflow.map(({ title, copy, icon: Icon }) => <article key={title}>
            <Icon size={23} strokeWidth={1.55} />
            <h3>{title}</h3><p>{copy}</p>
          </article>)}
        </div>
      </section>
    </main>
    <footer className="site-footer shell">
      <Brand /><p>Group 5 · ISTM 6227 · George Washington University</p>
      <Link href="/workspace" className="text-link">Workspace <ArrowUpRight size={14} /></Link>
    </footer>
  </>;
}
