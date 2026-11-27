import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Brand } from "../../../components/Brand";
import { ChartIcon } from "../../../components/ChartIcon";
import { campusBuildings } from "../../../lib/campus";

type Props = { params: Promise<{ building: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return campusBuildings.map(({ slug }) => ({ building: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { building } = await params;
  const department = campusBuildings.find(item => item.slug === building);
  return { title: department && `${department.name} records`, description: department?.description };
}

export default async function DepartmentPage({ params }: Props) {
  const { building } = await params;
  const department = campusBuildings.find(item => item.slug === building);
  if (!department) notFound();

  return <>
    <a href="#record-list" className="skip-link">Skip to records</a>
    <header className="site-header department-header shell">
      <Link href="/#campus" className="text-link department-back"><ArrowLeft size={16} /> Campus</Link>
      <Brand />
      <Link className="button button-outline header-action" href="/workspace">Workspace <ArrowUpRight size={16} /></Link>
    </header>
    <main className={`department shell department-${department.slug}`}>
      <section className="department-content" aria-labelledby="department-title">
        <div className="department-intro">
          <span className="department-mark"><ChartIcon name={department.icon} size={36} /></span>
          <h1 id="department-title">{department.name} records</h1>
          <p>{department.description}</p>
        </div>
        <section className="department-records" id="record-list" aria-labelledby="records-heading">
          <h2 id="records-heading">Example records</h2>
          <ul>
            {department.records.map(record => <li key={record.source}>
              <Link className="department-record" href={{ pathname: "/workspace", query: { case: record.patient, source: record.source } }}>
                <span className="department-record-name"><strong>{record.title}</strong><span>{record.detail}</span></span>
                <span className="department-format">{record.format}</span>
                <ArrowUpRight size={17} className="department-record-arrow" />
              </Link>
            </li>)}
          </ul>
        </section>
      </section>
      <nav className="department-nav" aria-label="Campus buildings">
        {campusBuildings.map(item => <Link key={item.slug} href={`/campus/${item.slug}`}
          aria-current={item.slug === department.slug ? "page" : undefined} className="department-tab">
          <ChartIcon name={item.icon} size={17} /> {item.name}
        </Link>)}
      </nav>
    </main>
  </>;
}
