import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import CampusMotion from "./CampusMotion";
import { ChartIcon } from "./ChartIcon";

import { campusBuildings } from "../lib/campus";

export default function Campus() {
  return <figure className="campus-figure" id="campus">
    <CampusMotion />
    <Image src="/campus.webp" alt="Isometric model of a hospital campus with four buildings" width={1091} height={755}
      className="campus-image" unoptimized loading="eager" fetchPriority="high" />
    <nav aria-label="Records by campus building" className="campus-links">
      {campusBuildings.map(building => <Link key={building.slug} className={`campus-pin pin-${building.icon}`}
        href={`/campus/${building.slug}`} aria-label={`${building.name} records`}>
        <span className="campus-pin-label"><ChartIcon name={building.icon} size={14} /> {building.name} <ArrowUpRight size={13} /></span>
      </Link>)}
    </nav>
  </figure>;
}
