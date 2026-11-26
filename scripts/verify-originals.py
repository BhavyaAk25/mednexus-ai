"""Confirm that the indexed passages match the generated text originals."""
import csv
import json
from pathlib import Path

from PIL import Image
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
patients = json.loads((root / "data" / "cases.json").read_text())
documents = 0
passages = 0
scans = 0


def normalize(text):
    return " ".join(text.split()).replace("’", "'")


for patient in patients:
    for source in patient["sources"]:
        file = root / "data" / "originals" / f'{source["id"]}.{source["format"].lower()}'
        facts = [normalize(fact[1]) for fact in source["facts"]]
        if source["format"] == "CSV":
            with file.open(newline="") as stream:
                rows = list(csv.DictReader(stream))
            assert len(rows) == len(facts), file.name
            for row, passage in zip(rows, facts, strict=True):
                assert row["synthetic"] == "true" and row["patient_id"] == patient["id"], file.name
                assert normalize(row["indexed_passage"]) == passage, file.name
        elif source["format"] == "PNG":
            with Image.open(file) as image:
                image.verify()
            scans += 1
        else:
            raw = file.read_text() if source["format"] == "TXT" else "\n".join(page.extract_text() for page in PdfReader(file).pages)
            assert patient["id"] in raw and all(fact in normalize(raw) for fact in facts), file.name
        documents += 1
        passages += len(facts)

print(f"{len(patients)} fictional patients, {documents} originals, {passages} indexed passages.")
print(f"{scans} scan files passed integrity checks. Their transcriptions are reviewed visually.")
