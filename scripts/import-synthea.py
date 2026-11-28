"""Import the official Synthea sample without direct identifiers or billing fields."""
import argparse
import csv
import hashlib
import io
import json
import re
from collections import defaultdict, Counter
from datetime import date
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
UPSTREAM = "https://synthetichealth.github.io/synthea-sample-data/downloads/latest/synthea_sample_data_csv_latest.zip"
TABLES = {
    "encounters": ("ENC", "Encounters", "Visit note", "Encounter", "START"),
    "conditions": ("CON", "Recorded conditions", "Visit note", "Condition", "START"),
    "medications": ("MED", "Medication history", "Medication list", "Medication", "START"),
    "observations": ("OBS", "Clinical observations", "Lab export", "Result", "DATE"),
    "allergies": ("ALG", "Allergy records", "Visit note", "Allergy", "START"),
}


def rows(archive, name):
    path, = (item for item in archive.namelist() if Path(item).name == name + ".csv")
    with archive.open(path) as member:
        yield from csv.DictReader(io.TextIOWrapper(member, encoding="utf-8-sig", newline=""))


def sentence(table, row, day):
    description = " ".join(row["DESCRIPTION"].split())
    if table == "observations":
        reading = " ".join(filter(None, (row["VALUE"].strip(), row["UNITS"].strip())))
        return f"{day} · {description}: {reading}."
    if table == "medications":
        stop = f' Stop recorded {row["STOP"][:10]}.' if row["STOP"] else ""
        return f"{day} · Medication recorded: {description}.{stop}"
    return f"{day} · {description}."


def write_json(name, value, compact=False):
    data = json.dumps(value, ensure_ascii=False, separators=(",", ":") if compact else None, indent=None if compact else 2)
    (ROOT / "data" / name).write_text(data + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    args = parser.parse_args()
    with ZipFile(args.archive) as archive:
        records = list(rows(archive, "patients"))
        assert records and len({row["Id"] for row in records}) == len(records)
        groups = {row["Id"]: defaultdict(list) for row in records}
        totals = Counter()
        for table, (_, _, _, kind, date_field) in TABLES.items():
            for row in rows(archive, table):
                day = date.fromisoformat(row[date_field][:10]).isoformat()
                text = sentence(table, row, day)
                groups[row["PATIENT"]][table, day[:4]].append((day, kind, text, row))
                totals[table] += 1

        patients, expected = [], []
        for number, person in enumerate(records, 1):
            ident = f"SN-{number:04d}"
            patient_groups = groups[person["Id"]]
            last_day = max(day for values in patient_groups.values() for day, *_ in values)
            at = date.fromisoformat(last_day)
            birth = date.fromisoformat(person["BIRTHDATE"])
            age = at.year - birth.year - ((at.month, at.day) < (birth.month, birth.day))
            sources, candidate_labs = [], []
            lab_counts = Counter((day, row["DESCRIPTION"]) for (table, _), items in patient_groups.items()
                                 if table == "observations" for day, _, _, row in items)
            for (table, year), items in sorted(patient_groups.items()):
                code, title, source_type, _, _ = TABLES[table]
                ordered = sorted(items, key=lambda item: (item[0], item[2]))
                for start in range(0, len(ordered), 120):
                    subset = ordered[start:start + 120]
                    part = start // 120 + 1
                    source_id = f"{ident}-{code}-{year}-{part}"
                    suffix = f" · part {part}" if len(ordered) > 120 else ""
                    sources.append({
                        "id":source_id, "date":subset[-1][0], "title":f"{title} · {year}{suffix}", "type":source_type,
                        "facility":"Synthea sample", "format":"CSV", "facts":[[kind, text] for _,kind,text,_ in subset]
                    })
                    if table != "observations":
                        continue
                    for idx, (day, _, text, row) in enumerate(subset, 1):
                        label = " ".join(row["DESCRIPTION"].split())
                        if (len(label) <= 65 and row["CATEGORY"] == "laboratory" and row["UNITS"]
                            and re.fullmatch(r"-?\d+(?:\.\d+)?", row["VALUE"])
                            and lab_counts[day, row["DESCRIPTION"]] == 1):
                            candidate_labs.append((day, label, f"{source_id}.{idx}"))
            if candidate_labs:
                day, label, fact_id = max(candidate_labs)
                expected.append({"id":ident, "title":label, "scenario":"results", "question":f"What was the recorded {label} result on {day}?", "critical":[fact_id], "conflicts":[]})
            patients.append({"id":ident,"name":f"Synthea Patient {number:03d}","initials":f"{number:03d}","age":age,"clinic":"Synthetic cohort","reason":"Longitudinal record review","visit":last_day,"tone":"sage","cohort":"synthea","sources":sources})
        benchmark = sorted(expected, key=lambda item: hashlib.sha256(("mednexus-holdout-v1:"+item["id"]).encode()).digest())[:6]
        assert len(benchmark) == 6
        write_json("synthea.json", patients, compact=True)
        write_json("synthea-benchmark.json", benchmark)
        all_counts = {Path(item).stem: sum(1 for _ in rows(archive, Path(item).stem))
                      for item in archive.namelist() if item.endswith(".csv")}
        checksum = hashlib.sha256(args.archive.read_bytes()).hexdigest()
        write_json("synthea-manifest.json", {"source":UPSTREAM,"sha256":checksum,"patients":len(patients),
                   "sourceFiles":len(all_counts),"upstreamRows":all_counts,"indexedRows":dict(totals),
                   "indexedPassages":sum(totals.values()),"documents":sum(len(p["sources"]) for p in patients),
                   "holdoutCases":len(benchmark)})


if __name__ == "__main__":
    main()
