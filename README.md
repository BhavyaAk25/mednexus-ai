# MedNexus AI

MedNexus AI is a course prototype for reviewing scattered outpatient records. It brings synthetic notes, labs, medication lists, and scanned intake forms into a patient timeline and a source-linked visit brief. The chart flags documented conflicts for clinician verification.

## Demo the workflow

[Open the public demo](https://mednexus-chart.vercel.app).

1. Open **Workspace** and choose **Enter as clinician**. Each homepage building has a records page with examples. Open a record, then choose a role if prompted.
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
- `components/campus-model.ts` builds the original campus in Three.js. Vehicles and pedestrians move briefly when the campus comes into view. The WebP render serves as a fallback for reduced motion or unavailable WebGL. Each building opens its own list of example records. The miniature-isometric direction was inspired by [yU+co's Silicon Valley title sequence](https://www.yuco.com/works/silicon-valley).

The browser uses [the patient portrait sheet](public/patient-portraits.webp), made with built-in image generation.

<details>
<summary>Patient portrait prompt</summary>

Generate a single horizontal contact sheet for a fictional outpatient medical chart app, three evenly sized square portrait panels in one row, with perfectly straight panel edges at exactly 1/3 and 2/3 width, no whitespace gutters, no frames. Use documentary-style outpatient registration photography, soft window light, real natural faces and an understated matte finish. Each face large, centered within its own third, eyes near the 43% line, with full hair and shoulders visible and equal head scale. Left: Eleanor, 67-year-old woman with silver close-cut hair, fair complexion, and a sage cardigan, on muted sage. Center: Marcus, 54-year-old Black man with closely cropped salt-and-pepper hair and warm medium deep skin, wearing an ordinary ochre overshirt, on light warm clay-beige. Right: Priya, 42-year-old brown-skinned woman with dark shoulder-length wavy hair wearing a simple muted red shirt, on warm dusty rose. Each looks calmly toward camera with a different natural expression. Clean, distinct silhouettes identifiable at 32px. Patient portraits in ordinary clothes, no clinical uniforms, equipment, typography, logos, icons, gradients, borders or decorative glare.

</details>

Regenerate the fictional source files with `python3 scripts/make-originals.py` on macOS with Pillow and ReportLab. Validate PDF, CSV, and TXT passage alignment and PNG readability with `python3 scripts/verify-originals.py` using Pillow and pypdf.

## Project brief

The [Word brief](MedNexus%20AI%20Project%20Brief.docx) covers demonstration steps, the full source inventory, SQLite columns and sample rows, the retrieval and model pipeline, and the measured outcomes.

## License

[MIT](LICENSE)
