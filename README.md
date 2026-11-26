# MedNexus AI

MedNexus AI is a course prototype for reviewing scattered outpatient records. It brings synthetic notes, labs, medication lists, and scanned intake forms into a patient timeline and a source-linked visit brief. The chart flags documented conflicts for clinician verification.

## Demo the workflow

1. Open **Workspace** and choose **Enter as clinician**. The homepage building links open individual source records after role selection.
2. Open **Eleanor Hayes**. Under **Needs review**, open the cardiology source and compare its lisinopril entry with the discharge and intake records.
3. Choose **Medication reconciliation** and generate a brief. Expand **Retrieved evidence** to see what entered the workflow.
4. Open **Timeline** and **Source records**, then try **Mark verified**. Verification is stored in a signed browser cookie.
5. Open **Evaluation lab** to inspect the recorded Ollama benchmark or run and export a new comparison.

The coordinator role sees two assigned cases and cannot change verification state. All records are fictional. The role selector simulates access controls and is open to anyone using the demo.

## Run locally

Use Node.js 22 and npm. The web app runs in evidence-extraction mode when Ollama is unavailable. Install the two Ollama models for the live generative workflow.

```sh
npm ci
ollama pull qwen2.5:1.5b
ollama pull nomic-embed-text
npm run dev
```

Open [localhost:3000](http://localhost:3000). No API key is needed. Ollama's local app or service should be running. The public hosting mode uses the bundled Nomic vectors for preset review prompts, SQLite full-text search for free-text questions, and exact source excerpts for briefs. The app labels the active retrieval and generation mode. The evaluation page includes the recorded local Qwen run.

```sh
npm run check
npm run build
npm run evaluate
npm run evaluate -- --evidence-only
```

Set `MEDNEXUS_URL` if the local app runs on a different port. The benchmark writes its JSON results to standard output. Run `npm run index` to rebuild the Nomic vector index after editing the fixture corpus or preset prompts.

## Data and system

- `data/cases.json` defines 3 fictional charts, 10 original files, and 27 reviewed passages. `data/originals/` contains the PDF, TXT, CSV, and PNG files. The PNG notes have pre-reviewed transcriptions. The demo has no live OCR or document uploads.
- `lib/store.ts` loads patient, document, passage, and full-text indexes into SQLite in each application process. API queries check the active role and patient assignment. Signed, HTTP-only cookies hold the demo role and browser-specific verification. A deployed build needs a `DEMO_SESSION_SECRET` environment variable.
- `lib/workflow.ts` ranks within the selected chart, adds other evidence for the same medication, compares recorded directions, and surfaces explicit documentation gaps. Qwen returns passage IDs in a structured response. The server checks those IDs and renders exact excerpts from the original sources. Gap detection and medication comparison are deterministic.
- `lib/evaluation.ts` compares the same model and prompts on the oldest record alone versus retrieved chart passages. The benchmark measures critical fact recall, citation match rate, seeded conflict detection, and server latency. It has three cases and no human timing or usability measurements.
- `scripts/campus-model.ts` builds the original campus in Three.js. The homepage serves the static WebP render and links each building directly to an example record. The miniature-isometric direction was inspired by [yU+co's Silicon Valley title sequence](https://www.yuco.com/works/silicon-valley).

The browser uses [the patient portrait sheet](public/patient-portraits.webp), made with built-in image generation. The prompt called for three centered, natural-light outpatient registration portraits in everyday clothes, with sage, warm clay, and dusty rose backdrops.

Regenerate the fictional source files with `python3 scripts/make-originals.py` on macOS with Pillow and ReportLab. Validate PDF, CSV, and TXT passage alignment and PNG readability with `python3 scripts/verify-originals.py` using Pillow and pypdf.

## Project brief

The [Word brief](MedNexus%20AI%20Project%20Brief.docx) covers demonstration steps, data provenance, the technical architecture, measured outcomes, and a proposed pilot.
