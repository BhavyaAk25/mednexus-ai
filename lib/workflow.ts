import { chooseEvidence } from "./models";
import { lexicalRank } from "./store";
import { scenarios } from "./scenarios";
import type { Answer, Fact, Flag, ModelProvider, Scenario, Source } from "./types";

function discrepancyFlags(facts: Fact[]) {
  const medicines = new Map<string, Fact[]>();
  for (const fact of facts) {
    if (!fact.medicine || !fact.value) continue;
    const group = medicines.get(fact.medicine) || [];
    group.push(fact);
    medicines.set(fact.medicine, group);
  }
  const flags: Flag[] = [];
  for (const [medicine, mentions] of medicines) {
    const values = new Set(mentions.map(fact => fact.value));
    if (values.size > 1 && new Set(mentions.map(fact => fact.documentId)).size > 1) {
      flags.push({ title: `${medicine[0].toUpperCase()}${medicine.slice(1)} directions differ`, detail: [...values].join(" vs. "), severity: "conflict", facts: mentions });
    }
  }
  const gaps = facts.filter(fact => (fact.kind === "Follow-up" || fact.kind === "Allergy") &&
    /not been received|still pending|not yet reviewed/i.test(fact.text));
  for (const fact of gaps) flags.push({ title: "Documentation gap", detail: fact.text, severity: "gap", facts: [fact] });
  return flags;
}


export async function buildAnswer(sources: Source[], scenario: Scenario, question = "", baseline = false, provider?: ModelProvider): Promise<Answer> {
  const start = performance.now();
  const facts = sources.flatMap(source => source.facts);
  const prompt = question || scenarios[scenario].question;
  const byId = new Map(facts.map(fact => [fact.id, fact]));
  const ranked = baseline ? sources.at(-1)!.facts : lexicalRank(sources[0].patientId, prompt, question ? [] : scenarios[scenario].kinds)
    .flatMap(id => byId.has(id) ? [byId.get(id)!] : []);
  const selection = (baseline || question || ranked.length ? ranked : facts).slice(0, question ? 5 : 8);
  const names = new Set(selection.map(fact => fact.medicine).filter(Boolean));
  const selectedIds = new Set(selection.map(fact => fact.id));
  const related = baseline ? [] : facts.filter(fact => fact.medicine && names.has(fact.medicine) && !selectedIds.has(fact.id));
  const context = [...selection, ...related].slice(0, 14);
  const scope = !baseline && !question ? facts : context;
  const limit = question ? 4 : 7;
  const chosen = provider && context.length ? await chooseEvidence(provider, prompt, context, limit, !!question) : null;
  return {
    findings: chosen?.findings ?? selection.slice(0, limit),
    flags: discrepancyFlags(scope),
    retrieval: baseline ? "First document" : "SQLite full-text",
    generation: chosen?.generation ?? "Evidence extract",
    model: chosen?.model,
    latency: Math.round(performance.now() - start),
    contextIds: context.map(fact => fact.id),
  };
}

export function initialAnswer(sources: Source[]): Answer {
  const all = sources.flatMap(source => source.facts);
  const kinds = scenarios.overview.kinds;
  const highlights = kinds.flatMap(kind => all.filter(fact => fact.kind === kind).slice(0, kind === "Medication" || kind === "Result" ? 2 : 1));
  return {
    findings: highlights.slice(0, 7), flags: discrepancyFlags(all),
    retrieval: "Chart overview", generation: "Evidence extract", latency: 0, contextIds: [],
  };
}
