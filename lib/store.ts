import { DatabaseSync } from "node:sqlite";
import fixtures from "../data/cases.json";
import type { Fact, FactKind, Patient, Role, Source } from "./types";

type DocumentRow = Omit<Source, "facts">;
type FactRow = Omit<Fact, "medicine" | "value"> & { medicine: string | null; value: string | null };

const assignments: Record<Role, string[]> = {
  clinician: ["MN-1042", "MN-1086", "MN-1135"],
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
  for (const { sources, ...patient } of fixtures) {
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

const database = createStore();

export function patientIndex(role: Role): Patient[] {
  const get = database.prepare("SELECT profile FROM patients WHERE id = ?");
  return assignments[role].map(id => JSON.parse(String(get.get(id)?.profile)) as Patient);
}

export function caseSources(role: Role, patientId: string): Source[] | null {
  if (!assignments[role].includes(patientId)) return null;
  const documents = database.prepare("SELECT * FROM documents WHERE patientId = ? ORDER BY date DESC, id").all(patientId) as unknown as DocumentRow[];
  const getFacts = database.prepare("SELECT * FROM facts WHERE documentId = ? ORDER BY id");
  return documents.map(doc => ({
    ...doc,
    facts: (getFacts.all(doc.id) as unknown as FactRow[]).map(({ medicine, value, ...fact }) => ({
      ...fact, medicine: medicine ?? undefined, value: value ?? undefined,
    })),
  }));
}

export function getSource(role: Role, id: string) {
  const row = database.prepare("SELECT * FROM documents WHERE id = ?").get(id) as unknown as DocumentRow | undefined;
  return row && assignments[role].includes(row.patientId) ? row : null;
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
  return database.prepare("SELECT factId FROM search WHERE search MATCH ? AND patientId = ? ORDER BY bm25(search), factId")
    .all(match, patientId).map(row => String(row.factId));
}
