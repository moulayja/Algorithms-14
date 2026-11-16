#!/usr/bin/env python3
"""Turn the NHIE study books (Word chapters + the 14-subject review PDF text)
into data/books.json for the trainer.

    python3 tools/extract_books.py <books_dir> data/books.json

<books_dir> holds the chapter .docx files (named NN-topic.docx) and, optionally,
x-master-review.txt (pdftotext -layout of the 14-subject review), which supplies
the subjects that have no Word chapter. The output is personal study material
and is deliberately not committed (see .gitignore).
"""
import html, json, os, re, sys, zipfile

TOPICS = [  # id, title, docx prefix or None, review subject number
    ("site", "Site Conditions", "07", 5),
    ("exterior", "Exterior Components", "08", 10),
    ("roof", "Roof Components", "09", 9),
    ("structure", "Structural Components", "10", 12),
    ("electrical", "Electrical System", None, 1),
    ("cooling", "Cooling System", "02", 7),
    ("heating", "Heating System", "03", 14),
    ("insulation", "Insulation & Ventilation", None, 11),
    ("plumbing", "Plumbing System", "04", 13),
    ("interior", "The House Interior", "12", 6),
    ("fireplaces", "Fireplaces & Chimneys", "05", 8),
    ("kitchen", "Kitchen Appliances", "06", 2),
    ("reporting", "Analysis & Reporting", "13", 3),
    ("professional", "Professional Responsibilities", None, 4),
]


def esc(s):
    return html.escape(s, quote=False)


def docx_paragraphs(path):
    xml = zipfile.ZipFile(path).read("word/document.xml").decode("utf8")
    for para in re.findall(r"<w:p[ >].*?</w:p>", xml, flags=re.S):
        runs = []
        for r in re.findall(r"<w:r[ >].*?</w:r>", para, flags=re.S):
            t = html.unescape("".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", r)))
            if not t:
                continue
            bold = bool(re.search(r'<w:b(/| w:val="(1|true)")', r))
            m = re.search(r'<w:sz w:val="(\d+)"', r)
            runs.append((t, bold, int(m.group(1)) if m else 0))
        if runs:
            yield runs


def parse_docx(path):
    sections, cur = [], None
    for runs in docx_paragraphs(path):
        text = "".join(t for t, _, _ in runs).strip()
        if not text:
            continue
        size = max(s for _, _, s in runs)
        if size >= 50:
            continue  # chapter title
        if size >= 40:
            cur = {"title": re.sub(r"^\d+\s*-\s*", "", text).strip().title()
                   if text.isupper() else re.sub(r"^\d+\s*-\s*", "", text).strip(), "blocks": []}
            sections.append(cur)
            continue
        if cur is None:
            cur = {"title": "Overview", "blocks": []}
            sections.append(cur)
        raw = "".join(t for t, _, _ in runs)
        m = re.match(r"^(\s*)([•◦▪])\s*", raw)
        if m:
            lvl = 1 if (m.group(2) != "•" or len(m.group(1)) >= 2) else 0
            skip, parts, term = len(m.group(0)), [], None
            for t, bold, _ in runs:
                if skip >= len(t):
                    skip -= len(t)
                    continue
                t, skip = t[skip:], 0
                if bold and not parts and t.strip().endswith(":"):
                    term = t.strip()[:-1]
                parts.append("<b>%s</b>" % esc(t) if bold else esc(t))
            block = {"t": "li", "l": lvl, "x": "".join(parts).strip()}
            if term:
                block["term"] = term
            cur["blocks"].append(block)
        elif all(b for t, b, _ in runs if t.strip()) and len(text) < 110:
            cur["blocks"].append({"t": "h", "x": esc(text)})
        else:
            cur["blocks"].append({"t": "p", "x": "".join(
                "<b>%s</b>" % esc(t) if b else esc(t) for t, b, _ in runs).strip()})
    return sections


def parse_review(path):
    """Split the review text into {subject number: sections}."""
    out, subj, cur = {}, None, None
    prev_long = False
    for line in open(path, encoding="utf8"):
        s = line.strip().replace("\x0c", "")
        m = re.match(r"^\W*SUBJECT (\d+) OF 14\b", s)
        if m and line[:6].strip():  # real heading, not the indented contents page
            subj = int(m.group(1))
            out.setdefault(subj, [])
            cur = {"title": "Big picture", "blocks": []}
            out[subj].append(cur)
            prev_long = False
            continue
        if subj is None or not s:
            prev_long = False
            continue
        if re.match(r"^(Official Export Study Edition|PAGE \d+|NHIE MASTER COURSE)", s):
            continue
        m = re.match(r"^(?:PART )?(\d+)\s*[.—-]\s*(.+)$", s)
        if m and s.upper() == s and len(s) < 90:
            title = re.sub(r"[⭐\s]+$", "", m.group(2)).strip().capitalize()
            cur = {"title": title, "blocks": []}
            out[subj].append(cur)
            prev_long = False
            continue
        if prev_long and cur["blocks"] and cur["blocks"][-1]["t"] == "p":
            cur["blocks"][-1]["x"] += " " + esc(s)
        elif len(s) < 46 and not re.search(r"[.:,;→=]$|\d", s) and s[0].isupper():
            cur["blocks"].append({"t": "h", "x": esc(s)})
        else:
            cur["blocks"].append({"t": "p", "x": esc(s)})
        prev_long = len(s) > 92
    for secs in out.values():
        secs[:] = [x for x in secs if x["blocks"]]
    return out


def main(src, dest):
    review_path = os.path.join(src, "x-master-review.txt")
    review = parse_review(review_path) if os.path.exists(review_path) else {}
    files = sorted(os.listdir(src))
    topics = []
    for tid, title, prefix, subj in TOPICS:
        docx = next((f for f in files if prefix and f.startswith(prefix) and f.endswith(".docx")), None)
        if docx:
            sections, source = parse_docx(os.path.join(src, docx)), "book"
        else:
            sections, source = review.get(subj, []), "review"
        cards = []
        for i, sec in enumerate(sections):
            for b in sec["blocks"]:
                term = b.pop("term", None)
                if term:
                    back = re.sub(r"^<b>.*?</b>\s*", "", b["x"])
                    if 25 <= len(back) <= 420 and len(term) <= 60:
                        cards.append({"s": i, "f": term, "b": back})
        topics.append({"id": tid, "title": title, "source": source,
                       "sections": sections, "cards": cards})
        print("%-13s %-7s sections=%2d blocks=%4d cards=%3d" % (
            tid, source, len(sections), sum(len(s["blocks"]) for s in sections), len(cards)))
    with open(dest, "w", encoding="utf8") as f:
        json.dump(topics, f, ensure_ascii=False, separators=(",", ":"))
    print("wrote", dest, os.path.getsize(dest) // 1024, "KB")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
