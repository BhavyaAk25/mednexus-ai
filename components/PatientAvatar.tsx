import type { Patient } from "../lib/types";

const portraitPosition: Record<string, string> = {
  "MN-1042": "portrait-eleanor",
  "MN-1086": "portrait-marcus",
  "MN-1135": "portrait-priya",
};

export function PatientAvatar({ patient, large = false }: { patient: Patient; large?: boolean }) {
  const portrait = portraitPosition[patient.id];
  return <span className={`avatar ${patient.tone}${large ? " avatar-large" : ""}`} aria-hidden="true">
    {portrait && <span className={`patient-portrait ${portrait}`} />}{patient.initials}
  </span>;
}
