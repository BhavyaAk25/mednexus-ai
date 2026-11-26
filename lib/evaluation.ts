import type { Answer, Role, Scenario, Source } from "./types";
import { caseSources } from "./store";
import { buildAnswer } from "./workflow";

const cases: { id: string; title: string; scenario: Scenario; critical: string[]; conflicts: string[][] }[] = [
  { id: "MN-1042", title: "Dose conflict after discharge", scenario: "medications", critical: ["EH-01.2", "EH-02.1", "EH-04.2", "EH-01.3"], conflicts: [["EH-01.2", "EH-02.1"]] },
  { id: "MN-1086", title: "Outside lab and pending result", scenario: "results", critical: ["MB-02.1", "MB-02.2", "MB-03.2"], conflicts: [] },
  { id: "MN-1135", title: "Specialist and pharmacy directions", scenario: "medications", critical: ["PM-01.2", "PM-02.1", "PM-02.2"], conflicts: [["PM-01.2", "PM-02.1"]] },
];

function score(answer: Answer, expected: typeof cases[number], sources: Source[]) {
  const surfaced = new Set(answer.findings.map(fact => fact.id));
  const factIndex = new Map(sources.flatMap(source => source.facts.map(fact => [fact.id, fact] as const)));
  const cited = [...new Map([...answer.findings, ...answer.flags.flatMap(flag => flag.facts)].map(fact => [fact.id, fact])).values()];
  const correct = cited.filter(fact => {
    const expectedFact = factIndex.get(fact.id);
    return expectedFact?.documentId === fact.documentId && expectedFact.text === fact.text;
  }).length;
  const flags = answer.flags.filter(flag => flag.severity === "conflict");
  const flagIds = flags.map(flag => new Set(flag.facts.map(fact => fact.id)));
  const relevantFlag = (ids: Set<string>, group: string[]) => group.every(id => ids.has(id));
  return {
    criticalFound: expected.critical.filter(id => surfaced.has(id)).length,
    criticalTotal: expected.critical.length,
    correctCitations: correct,
    citations: cited.length,
    unsupported: cited.length - correct,
    conflictsFound: expected.conflicts.filter(group => flagIds.some(ids => relevantFlag(ids, group))).length,
    conflictsTotal: expected.conflicts.length,
    falseFlags: flagIds.filter(ids => !expected.conflicts.some(group => relevantFlag(ids, group))).length,
    latency: answer.latency,
    generation: answer.generation,
    retrieval: answer.retrieval,
    evidence: answer.findings.map(fact => fact.id),
  };
}

export async function evaluate(role: Role, useModel: boolean) {
  const rows = [];
  for (const fixture of cases) {
    const sources = caseSources(role, fixture.id);
    if (!sources?.length) continue;
    const single = await buildAnswer(sources, fixture.scenario, "", true, useModel);
    const retrieved = await buildAnswer(sources, fixture.scenario, "", false, useModel);
    rows.push({
      id: fixture.id, title: fixture.title, expected: fixture.critical,
      baseline: score(single, fixture, sources), rag: score(retrieved, fixture, sources),
    });
  }
  return { fixtureVersion: "2026-11-26", scope: role, rows };
}
