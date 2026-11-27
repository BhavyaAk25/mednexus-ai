import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { Brand } from "../components/Brand";
import Campus from "../components/Campus";
import { WorkflowIllustration } from "../components/WorkflowIllustration";

const workflow = [
  { title: "Find the record", copy: "Browse the clinic’s intake notes and referrals.", step: "find", href: "/campus/clinic" },
  { title: "Compare the evidence", copy: "See the two recorded doses flagged in Eleanor’s chart.", step: "compare", href: "/workspace?case=MN-1042" },
  { title: "Verify the brief", copy: "Open the original cardiology letter behind the finding.", step: "verify", href: "/workspace?case=MN-1042&source=EH-02" },
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
      <section className="workflow-band" id="workflow" aria-labelledby="workflow-title">
        <div className="workflow shell">
          <div className="workflow-title">
            <h2 id="workflow-title">The review workflow</h2>
            <Link href="/workspace?view=evaluation" className="text-link">View the evaluation <ArrowUpRight size={15} /></Link>
          </div>
          <ul className="workflow-grid">
            {workflow.map(({ title, copy, step, href }) => <li key={step}>
              <Link href={href} className="workflow-link" aria-labelledby={`workflow-${step}-title`} aria-describedby={`workflow-${step}-detail`}>
                <WorkflowIllustration step={step} />
                <div className="workflow-copy">
                  <h3 id={`workflow-${step}-title`}>{title}</h3>
                  <p id={`workflow-${step}-detail`}>{copy}</p>
                </div>
                <span className="workflow-arrow"><ArrowUpRight size={16} aria-hidden="true" /></span>
              </Link>
            </li>)}
          </ul>
        </div>
      </section>
    </main>
  </>;
}
