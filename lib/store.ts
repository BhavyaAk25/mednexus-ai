import { DatabaseSync } from "node:sqlite";
import fixtures from "../data/cases.json";
import synthea from "../data/synthea.json";
import type { Fact, FactKind, Patient, Role, Source } from "./types";

type DocumentRow = Omit<Source, "facts">;
type FactRow = Omit<Fact, "medicine" | "value"> & { medicine: string | null; value: string | null };

const assignments: Record<Role, string[]> = {
  clinician: [...fixtures.map(patient => patient.id), ...synthea.map(patient => patient.id)],
  coordinator: ["MN-1042", "MN-1086"],
};

function createStore() {
  const database = new DatabaseSync(":memory:");
  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE patients (id TEXT PRIMARY KEY, profile TEXT NOT NULL);
    CREATE TABLE documents (
      id TEXT PRIMARY KEY, patientId TEXT NOT NULL REFERENCES patients(id),
      date TEXT NOT NULL, title TEXT NOT NULL, type TEXT NOT NULL, facility TEXT NOT NULL, format TEXT NOT NULL
    );
    CREATE TABLE facts (
      id TEXT PRIMARY KEY, documentId TEXT NOT NULL REFERENCES documents(id),
      kind TEXT NOT NULL, text TEXT NOT NULL, medicine TEXT, value TEXT
    );
    CREATE VIRTUAL TABLE search USING fts5(factId UNINDEXED, patientId UNINDEXED, terms);
    CREATE INDEX patient_documents ON documents(patientId, date);
    CREATE INDEX document_facts ON facts(documentId);
  `);
  const addPatient = database.prepare("INSERT INTO patients VALUES (?, ?)");
  const addDocument = database.prepare("INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?, ?)");
  const addFact = database.prepare("INSERT INTO facts VALUES (?, ?, ?, ?, ?, ?)");
  const indexFact = database.prepare("INSERT INTO search VALUES (?, ?, ?)");
  database.exec("BEGIN");
  for (const { sources, ...patient } of [...fixtures, ...synthea]) {
    addPatient.run(patient.id, JSON.stringify(patient));
    for (const source of sources) {
      addDocument.run(source.id, patient.id, source.date, source.title, source.type, source.facility, source.format);
      source.facts.forEach(([kind, text, medicine, value], index) => {
        const id = `${source.id}.${index + 1}`;
        addFact.run(id, source.id, kind, text, medicine ?? null, value ?? null);
        indexFact.run(id, patient.id, `${kind} ${source.type} ${source.title} ${text}`);
      });
    }
  }
  database.exec("COMMIT");
  return database;
}

let store: DatabaseSync | undefined;
const db = () => store ??= createStore();

export function patientIndex(role: Role): Patient[] {
  const get = db().prepare("SELECT profile FROM patients WHERE id = ?");
  return assignments[role].map(id => JSON.parse(String(get.get(id)?.profile)) as Patient);
}

function documentFacts(id: string): Fact[] {
  const rows = db().prepare("SELECT * FROM facts WHERE documentId = ? ORDER BY CAST(substr(id, instr(id,'.') + 1) AS INTEGER)")
    .all(id) as unknown as FactRow[];
  return rows.map(({ medicine, value, ...fact }) => ({ ...fact, medicine: medicine ?? undefined, value: value ?? undefined }));
}

export function caseSources(role: Role, patientId: string): Source[] | null {
  if (!assignments[role].includes(patientId)) return null;
  const documents = db().prepare("SELECT * FROM documents WHERE patientId = ? ORDER BY date DESC, id")
    .all(patientId) as unknown as DocumentRow[];
  return documents.map(doc => ({ ...doc, facts: documentFacts(doc.id) }));
}

export function getSource(role: Role, id: string) {
  const row = db().prepare("SELECT * FROM documents WHERE id = ?").get(id) as unknown as DocumentRow | undefined;
  return row && assignments[role].includes(row.patientId) ? row : null;
}

export function exportSyntheaSource(role: Role, id: string) {
  const source = getSource(role, id);
  if (!source?.patientId.startsWith("SN-")) return null;
  const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return "synthetic,patient_id,document_id,passage_id,category,source_excerpt\n" +
    documentFacts(id).map(fact => ["true", source.patientId, id, fact.id, fact.kind, fact.text].map(cell).join(",")).join("\n") + "\n";
}

const relatedTerms: Record<string, string> = {
  meds: "medication", drugs: "medication", dose: "medication", prescription: "medication",
  labs: "result", bloodwork: "result", tests: "result", a1c: "hemoglobin result",
  outstanding: "pending follow-up", missing: "pending gap", allergies: "allergy",
};
export function lexicalRank(patientId: string, query: string, kinds: FactKind[]) {
  const words = query.toLowerCase().match(/[a-z0-9]{2,}/g) ?? [];
  const ignored = new Set(["the", "what", "show", "has", "was", "were", "and", "for", "from", "about", "this", "are", "when", "which", "did", "any", "please", "latest", "patient", "patients", "record", "records", "recorded", "documented", "number", "there", "would", "could", "can", "me", "tell"]);
  const terms = [...new Set([...words.flatMap(word => ignored.has(word) ? [] : [word, ...(relatedTerms[word]?.split(" ") ?? [])]), ...kinds.flatMap(kind => kind.toLowerCase().split("-"))])];
  if (!terms.length) return [];
  const match = terms.slice(0, 40).map(term => `"${term}"`).join(" OR ");
  const date = query.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0] ?? "";
  return db().prepare("SELECT factId FROM search WHERE search MATCH ? AND patientId = ? ORDER BY CASE WHEN ? <> '' AND instr(terms, ?) > 0 THEN 0 ELSE 1 END, bm25(search), factId LIMIT 24")
    .all(match, patientId, date, date).map(row => String(row.factId));
}
