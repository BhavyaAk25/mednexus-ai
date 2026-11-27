import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { Brand } from "../components/Brand";
import Campus from "../components/Campus";
import { ChartIcon } from "../components/ChartIcon";

const workflow = [
  { title: "Find the record", copy: "Search notes, labs, and medication lists in one chart.", icon: "records" },
  { title: "Compare the evidence", copy: "Spot conflicting doses and pending results.", icon: "compare" },
  { title: "Verify the brief", copy: "Check each finding against the original record.", icon: "verify" },
] as const;

export default function Home() {
  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="site-header shell">
      <nav aria-label="Primary navigation">
        <a href="#workflow">Workflow</a>
        <Link href="/workspace?view=evaluation">Evaluation</Link>
      </nav>
      <Brand />
      <Link className="button button-outline header-action" href="/workspace">Workspace <ArrowUpRight size={16} /></Link>
    </header>

    <main id="main">
      <section className="hero-band" aria-labelledby="hero-title">
        <div className="hero shell">
          <div className="hero-content">
            <h1 id="hero-title">Every record.<br /><span>One clear view.</span></h1>
            <p>Review patient records in one chart. Trace each finding to its source.</p>
            <div className="hero-actions">
              <Link href="/workspace" className="button button-green">Open the workspace <ArrowRight size={18} /></Link>
              <a href="#workflow" className="button button-green">See how it works <ArrowDown size={18} /></a>
            </div>
          </div>
          <Campus />
        </div>
      </section>
      <section className="workflow shell" id="workflow" aria-labelledby="workflow-title">
        <div className="workflow-title">
          <h2 id="workflow-title">The review workflow</h2>
          <Link href="/workspace?view=evaluation" className="text-link">View the evaluation <ArrowUpRight size={15} /></Link>
        </div>
        <div className="workflow-grid">
          {workflow.map(({ title, copy, icon }) => <article key={title}>
            <ChartIcon name={icon} size={25} />
            <h3>{title}</h3><p>{copy}</p>
          </article>)}
        </div>
      </section>
    </main>
  </>;
}
