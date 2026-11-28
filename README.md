# MedNexus AI

MedNexus AI is a course prototype for reviewing scattered outpatient records. It brings synthetic notes, labs, medication lists, and scanned intake forms into a patient timeline and a source-linked visit brief. The chart flags documented conflicts for clinician verification.

## Try the workflow

[Open the public demo](https://mednexus-chart.vercel.app). Select **Workspace → Enter as clinician → Walkthrough**, then choose **Eleanor Hayes** to compare the two sources with different medication directions. Choose **Synthea** in the patient sidebar to browse the imported cohort. Open **Evaluation lab** for either the walkthrough cases or six held-out Synthea lab questions. The care coordinator role sees two assigned walkthrough cases.

## Run locally

Use Node.js 22.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Evidence extraction works without credentials.

## Hosted model configuration

Create a key in [GroqCloud](https://console.groq.com/keys) or [Google AI Studio](https://aistudio.google.com/apikey). Check the provider's free-tier limits. In the Vercel project, open **Settings → Environment Variables** and add the key as a **Secret** in **Preview**. Deploy after saving the environment variable.

| Variable | Default model |
| --- | --- |
| `GROQ_API_KEY` | `openai/gpt-oss-20b` |
| `GEMINI_API_KEY` | `gemini-3.1-flash-lite` |

Set each key in the gitignored `.env.local` for local testing, or as a Secret in the project's Vercel environment. Optional `GROQ_MODEL` and `GEMINI_MODEL` overrides are in `.env.example`. The brief tries Groq first, then Gemini if Groq fails, then ranked excerpts if neither provider is available. Evaluation uses the selected provider alone and reports any excerpt fallback. Use only fictional content in the app. Server routes keep the keys private. See [Groq rate limits](https://console.groq.com/docs/rate-limits) and [Gemini pricing](https://aistudio.google.com/docs/pricing).

## Data and evaluation

- The authored walkthrough contains 3 fictional charts, 10 sources and 27 indexed passages. `data/cases.json` defines those charts, and `data/originals/` contains the generated files.
- The official [Synthea sample](https://synthetichealth.github.io/downloads.html) is labeled 100 patients. The imported snapshot contains 112 unique patient IDs in 18 CSV files. The app indexes 104,326 passages from encounters, conditions, medications, observations and allergies across those patients. Direct identifiers, addresses and billing fields are excluded from the app bundle. The unmodified archive is downloaded separately and ignored by Git and Vercel.
- `data/synthea-manifest.json` records the upstream download, SHA-256 and table counts. `data/synthea.json` contains the normalized cohort, grouped by chart, table and year. Its source downloads are generated excerpts in CSV. The six holdout questions and expected passage IDs are recorded in `data/synthea-benchmark.json`.
- SQLite FTS5 ranks passages within the authorized chart. The server can ask the configured provider to select passage IDs in structured JSON, then checks the IDs and renders cited excerpts. Conflict and missing-document flags use explicit rules. Available passages are displayed as evidence extracts if inference is unavailable.
- The benchmark compares the oldest document with retrieved passages from the same chart. The cohort suite tests lab value retrieval. The walkthrough suite tests seeded medication conflicts. Both report critical fact recall, citation accuracy and latency. The evaluation labels any provider runs that fall back to evidence extraction.

Reproduce the normalized dataset from the source archive:

```sh
mkdir -p data/upstream
curl -fL https://synthetichealth.github.io/synthea-sample-data/downloads/latest/synthea_sample_data_csv_latest.zip -o data/upstream/synthea-100-csv.zip
python3 scripts/import-synthea.py data/upstream/synthea-100-csv.zip
```

The dataset was generated with Synthea. See [Walonoski et al., 2018](https://doi.org/10.1093/jamia/ocx079).

With the app running:

```sh
npm run check
npm run build
npm run evaluate
npm run evaluate -- --walkthrough
npm run evaluate -- --mode=groq
npm run evaluate -- --mode=gemini
```

Set `MEDNEXUS_URL` for a non-default port. The benchmark writes JSON to standard output. Provider runs require the corresponding key on the server.

Three.js renders the original miniature campus. Each building opens a list of example records. The isometric design was inspired by [yU+co's Silicon Valley title sequence](https://www.yuco.com/works/silicon-valley).

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
