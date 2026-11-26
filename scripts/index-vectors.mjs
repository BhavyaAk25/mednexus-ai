import { readFile, writeFile } from "node:fs/promises";

const cases = JSON.parse(await readFile(new URL("../data/cases.json", import.meta.url), "utf8"));
const queries = {
  overview: "Summarize the encounter, medication differences, allergies, results, and open follow-up items.",
  medications: "Which medications and doses are documented, and do the sources disagree?",
  results: "What laboratory or test results are documented and what testing is pending?",
  "follow-up": "What follow-up was requested and which results or documentation are missing or pending?",
};
const entries = [
  ...Object.entries(queries).map(([key, question]) => [`query:${key}`, `search_query: ${question}`]),
  ...cases.flatMap(patient => patient.sources.flatMap(source => source.facts.map(
    ([kind, text], i) => [`${source.id}.${i + 1}`, `search_document: ${kind}. ${text}`],
  ))),
];
const response = await fetch(`${process.env.OLLAMA_URL || "http://127.0.0.1:11434"}/api/embed`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ model: "nomic-embed-text", dimensions: 256, input: entries.map(entry => entry[1]) }),
});
if (!response.ok) throw new Error(await response.text());
const { embeddings } = await response.json();
if (embeddings.length !== entries.length || embeddings.some(vector => vector.length !== 256)) throw new Error("Unexpected embedding shape");
const vectors = Object.fromEntries(entries.map(([id], i) => [id, embeddings[i].map(value => Math.round(value * 1e6) / 1e6)]));
await writeFile(new URL("../data/vectors.json", import.meta.url), JSON.stringify(vectors) + "\n");
console.log(`Indexed ${entries.length} evidence passages and preset questions.`);
