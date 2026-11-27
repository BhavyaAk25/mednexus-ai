export const campusBuildings = [
  {
    slug: "hospital",
    name: "Hospital",
    title: "Hospital records",
    icon: "hospital",
    description: "Review what happened during admission and what the team documented at discharge.",
    records: [
      { patient: "MN-1042", source: "EH-01", title: "Hospital discharge summary", format: "PDF", detail: "Admission, discharge medications, and follow-up from Northbank Medical Center." },
    ],
  },
  {
    slug: "specialists",
    name: "Specialists",
    title: "Specialist records",
    icon: "specialist",
    description: "See what a specialist documented after the hospital stay.",
    records: [
      { patient: "MN-1042", source: "EH-02", title: "Cardiology correspondence", format: "TXT", detail: "Northbank Cardiology’s medication and lab follow-up letter." },
    ],
  },
  {
    slug: "clinic",
    name: "Clinic",
    title: "Clinic records",
    icon: "clinic",
    description: "Review what patients report at intake and why they were referred.",
    records: [
      { patient: "MN-1042", source: "EH-04", title: "Intake medication note", format: "PNG", detail: "Patient-reported medications and allergies recorded at an outpatient visit." },
      { patient: "MN-1086", source: "MB-01", title: "Primary care referral", format: "PDF", detail: "The referring clinic’s request for endocrinology review." },
    ],
  },
  {
    slug: "lab",
    name: "Lab",
    title: "Lab records",
    icon: "lab",
    description: "Open test results from the lab that reported them.",
    records: [
      { patient: "MN-1042", source: "EH-03", title: "Basic metabolic panel", format: "CSV", detail: "Serum results from Union Lab Services." },
      { patient: "MN-1086", source: "MB-02", title: "Outside lab results", format: "CSV", detail: "Results sent by Eastbank Reference Lab." },
    ],
  },
] as const;

export function findCampusRecord(patient?: string, source?: string) {
  return campusBuildings.flatMap(building => [...building.records]).find(record => record.patient === patient && record.source === source);
}
