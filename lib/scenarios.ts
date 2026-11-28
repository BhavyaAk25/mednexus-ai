import type { FactKind, Scenario } from "./types";

export const scenarios: Record<Scenario, { label: string; question: string; kinds: FactKind[] }> = {
  overview: { label: "Visit overview", question: "Summarize the encounter, medication differences, allergies, results, and open follow-up items.", kinds: ["Encounter", "Medication", "Result", "Follow-up", "Allergy", "Condition"] },
  medications: { label: "Medication reconciliation", question: "Which medications and doses are documented, and do the sources disagree?", kinds: ["Medication", "Allergy"] },
  results: { label: "Results review", question: "What laboratory or test results are documented and what testing is pending?", kinds: ["Result", "Follow-up"] },
  "follow-up": { label: "Follow-up and gaps", question: "What follow-up was requested and which results or documentation are missing or pending?", kinds: ["Follow-up", "Allergy"] },
};

export function isScenario(value: unknown): value is Scenario {
  return typeof value === "string" && Object.hasOwn(scenarios, value);
}
