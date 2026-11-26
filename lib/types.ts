export type Role = "clinician" | "coordinator";
export type RecordType = "Visit note" | "Specialist letter" | "Lab export" | "Scanned note" | "Medication list";
export type FactKind = "Encounter" | "Medication" | "Result" | "Follow-up" | "Allergy";
export type Scenario = "overview" | "medications" | "results" | "follow-up";

export interface Fact {
  id: string;
  documentId: string;
  kind: FactKind;
  text: string;
  medicine?: string;
  value?: string;
}
export interface Source {
  id: string;
  patientId: string;
  date: string;
  title: string;
  type: RecordType;
  facility: string;
  format: "TXT" | "PDF" | "CSV" | "PNG";
  facts: Fact[];
}
export interface Patient {
  id: string;
  name: string;
  initials: string;
  age: number;
  clinic: string;
  reason: string;
  visit: string;
  tone: string;
}
export interface CaseRecord {
  patient: Patient;
  sources: Source[];
  reviewed: boolean;
}
export interface Flag {
  title: string;
  detail: string;
  severity: "conflict" | "gap";
  facts: Fact[];
}
export interface Answer {
  findings: Fact[];
  flags: Flag[];
  retrieval: "Nomic embeddings" | "SQLite full-text" | "First document" | "Chart overview";
  generation: "Qwen via Ollama" | "Evidence extract";
  latency: number;
  contextIds: string[];
}
