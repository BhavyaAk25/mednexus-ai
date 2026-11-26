"""Regenerate the fictional records bundled with the demonstration."""
import csv
import json
import random
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen.canvas import Canvas

root = Path(__file__).resolve().parents[1]
source_dir = root / "data" / "originals"
source_dir.mkdir(exist_ok=True)
patients = json.loads((root / "data" / "cases.json").read_text())
font_dir = Path("/System/Library/Fonts/Supplemental")


def heading(patient, source):
    return [
        source["title"], source["facility"], f"{patient['name']} | {patient['id']} | {source['date']}",
        "Fictional record for the MedNexus AI course demonstration",
    ]


def make_pdf(file_path, metadata, facts):
    canvas = Canvas(str(file_path), pagesize=letter, invariant=1)
    canvas.setTitle(metadata[0])
    canvas.setAuthor("MedNexus AI synthetic records")
    canvas.setFillColor(HexColor("#214237"))
    canvas.setFont("Helvetica-Bold", 21)
    canvas.drawString(52, 722, metadata[0])
    canvas.setFillColor(HexColor("#46584b"))
    canvas.setFont("Helvetica", 11)
    for i, row in enumerate(metadata[1:]):
        canvas.drawString(52, 696 - 17 * i, row)
    canvas.setStrokeColor(HexColor("#c6d4c2"))
    canvas.line(52, 638, 560, 638)
    y = 608
    for kind, text, *_ in facts:
        canvas.setFont("Helvetica-Bold", 10)
        canvas.drawString(52, y, kind.upper())
        y -= 18
        canvas.setFont("Helvetica", 12)
        for line in textwrap.wrap(text, 84):
            canvas.drawString(52, y, line)
            y -= 17
        y -= 15
    canvas.save()


def make_scan(file_path, source, metadata):
    width, height = 1140, 610
    rng = random.Random(source["id"])
    paper = Image.new("RGB", (width, height))
    paper.putdata([(246 + (v := rng.randrange(-4, 5)), 239 + v, 215 + v) for _ in range(width * height)])
    draw = ImageDraw.Draw(paper)
    standard = ImageFont.truetype(str(font_dir / "Courier New.ttf"), 21)
    handwritten = ImageFont.truetype(str(font_dir / "Bradley Hand Bold.ttf"), 35)
    draw.text((58, 43), "UNION OUTPATIENT CLINIC  /  SCANNED INTAKE", font=standard, fill="#49573f")
    draw.text((58, 86), metadata[2], font=standard, fill="#49573f")
    draw.text((58, 125), "SYNTHETIC RECORD", font=standard, fill="#854838")
    for y in range(210, 599, 53):
        draw.line((53, y, 1087, y), fill="#c3c7aa", width=2)
    draw.line((77, 182, 77, 578), fill="#c99587", width=2)
    lines = [line for fact in source["facts"] for line in textwrap.wrap(fact[1], 65)]
    for i, line in enumerate(lines):
        draw.text((92 + (i % 2) * 5, 172 + i * 53), line, font=handwritten, fill="#293e4b")
    paper.save(file_path, optimize=True)


for patient in patients:
    for source in patient["sources"]:
        file_path = source_dir / f'{source["id"]}.{source["format"].lower()}'
        metadata = heading(patient, source)
        if source["format"] == "PDF":
            make_pdf(file_path, metadata, source["facts"])
        elif source["format"] == "CSV":
            with file_path.open("w", newline="") as handle:
                table = csv.writer(handle, lineterminator="\n")
                table.writerow(["synthetic", "record_id", "patient_id", "date", "facility", "analyte", "result", "units", "indexed_passage"])
                for fact in source["facts"]:
                    table.writerow(["true", source["id"], patient["id"], source["date"], source["facility"], *fact[4:7], fact[1]])
        elif source["format"] == "PNG":
            make_scan(file_path, source, metadata)
        else:
            file_path.write_text("\n".join([*metadata, "", *[f"{fact[0]}\n{fact[1]}\n" for fact in source["facts"]]]))
