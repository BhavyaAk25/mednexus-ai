import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ChartIcon } from "./ChartIcon";

const stops = [
  { name: "Hospital", icon: "hospital", document: "EH-01", title: "Hospital discharge summary" },
  { name: "Specialists", icon: "specialist", document: "EH-02", title: "Cardiology correspondence" },
  { name: "Clinic", icon: "clinic", document: "EH-04", title: "Intake medication note" },
  { name: "Lab", icon: "lab", document: "EH-03", title: "Basic metabolic panel" },
] as const;

export default function Campus() {
  return <figure className="campus-figure">
    <Image src="/campus.webp" alt="Isometric model of a hospital campus with four buildings" width={1091} height={755}
      className="campus-image" unoptimized fetchPriority="high" />
    <nav aria-label="Records by campus building" className="campus-links">
      {stops.map(stop => <Link key={stop.document} className={`campus-pin pin-${stop.icon}`}
        href={`/workspace?case=MN-1042&source=${stop.document}`} aria-label={`${stop.name}: ${stop.title}`} title={stop.title}>
        <span className="campus-pin-label"><ChartIcon name={stop.icon} size={14} /> {stop.name} <ArrowUpRight size={13} /></span>
      </Link>)}
    </nav>
  </figure>;
}
