"""Build Kai's resume PDF from the checked-in semantic resume page.

Usage:
    # single output (default: website static/)
    python scripts/build-resume.py

    # multiple outputs in one run
    python scripts/build-resume.py \\
        --out static/resume.pdf \\
        --out ~/projects/coilysiren/coilyco-vault/Obsidian\\ Vault/Notes/resume-2026.pdf

    # custom source
    python scripts/build-resume.py --source path/to/resume.md

Phone numbers are never written to the output PDF under any circumstance,
even if the source markdown contains one.

Requires: reportlab, pillow. Install with `pip install reportlab pillow`.
"""

from __future__ import annotations

import argparse
import io
import math
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from PIL import Image, ImageDraw
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    Image as RLImage,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

# --- defaults ----------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCE = REPO_ROOT / "src" / "pages" / "resume.md"
DEFAULT_AVATAR = REPO_ROOT / "src" / "images" / "headshot.jpg"
DEFAULT_OUTPUT = REPO_ROOT / "static" / "resume.pdf"

# --- palette -----------------------------------------------------------------
TEAL = HexColor("#1E5F6B")
CORAL = HexColor("#D98A5F")
SAGE = HexColor("#7A9A6B")
INK = HexColor("#2C2C2C")
MUTED = HexColor("#6B6B6B")


# Markdown parser
@dataclass
class Contact:
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    citizenship: Optional[str] = None


@dataclass
class Job:
    company: str
    url: str
    role: str
    location: Optional[str]
    dates: str
    stack: Optional[str] = None
    bullets: list[str] = field(default_factory=list)


@dataclass
class Resume:
    name: str = ""
    summary: list[str] = field(default_factory=list)
    contact: Contact = field(default_factory=Contact)
    evidence: list[tuple[str, str]] = field(default_factory=list)
    skills: list[tuple[str, str]] = field(default_factory=list)
    jobs: list[Job] = field(default_factory=list)
    community: list[Job] = field(default_factory=list)


JOB_HEADER_RE = re.compile(
    r"^\[(?P<company>[^\]]+)\]\((?P<url>[^)]+)\)\s*//\s*"
    r"\*\*(?P<role>[^*]+)\*\*"
    r"(?:\s*//\s*(?P<third>[^/]+?))?"
    r"(?:\s*//\s*(?P<fourth>[^/]+?))?"
    r"\s*$"
)

LABELED_LINE_RE = re.compile(
    r"^-\s*\*\*(?P<label>[^*:]+):?\*\*:?\s*(?P<value>.+)$"
)

CONTACT_PREFIX_RE = re.compile(r"^//\s*(?P<rest>.+)$")
STACK_LINE_RE = re.compile(r"^\*\*Stack:\*\*\s*(?P<value>.+)$")


def _strip_page_frontmatter(md: str) -> str:
    """Remove page frontmatter before parsing the shared resume body."""
    return re.sub(r"\A---\s*\n[\s\S]*?\n---\s*\n", "", md, count=1)


def parse_resume(md: str) -> Resume:
    r = Resume()
    lines = _strip_page_frontmatter(md).splitlines()
    i = 0
    section = "intro"  # intro | evidence | skills | experience | community
    current_job: Optional[Job] = None

    def flush_job():
        nonlocal current_job
        if current_job is None:
            return
        if section == "community":
            r.community.append(current_job)
        else:
            r.jobs.append(current_job)
        current_job = None

    while i < len(lines):
        raw = lines[i]
        line = raw.strip()

        # H1 -> name
        if line.startswith("# ") and not r.name:
            r.name = line[2:].strip()
            i += 1
            continue

        # H2 -> section switch
        if line.startswith("## "):
            flush_job()
            header = line[3:].strip().lower()
            # normalize html entity / ampersand
            header = header.replace("&amp;", "&")
            if "evidence" in header:
                section = "evidence"
            elif "skill" in header:
                section = "skills"
            elif "experience" in header:
                section = "experience"
            elif "community" in header or "open source" in header:
                section = "community"
            else:
                section = "other"
            i += 1
            continue

        # empty line
        if not line:
            i += 1
            continue

        if section == "intro":
            m = CONTACT_PREFIX_RE.match(line)
            if m:
                _assign_contact(r.contact, m.group("rest").strip())
            else:
                # strip markdown bold/italic markers for summary paragraphs
                r.summary.append(_strip_inline_md(line))
            i += 1
            continue

        if section in ("evidence", "skills"):
            m = LABELED_LINE_RE.match(line)
            if m:
                item = (
                    m.group("label").strip(),
                    _strip_inline_md(m.group("value").strip()),
                )
                if section == "evidence":
                    r.evidence.append(item)
                else:
                    r.skills.append(item)
            i += 1
            continue

        if section in ("experience", "community"):
            m = JOB_HEADER_RE.match(line)
            if m:
                flush_job()
                third = (m.group("third") or "").strip() or None
                fourth = (m.group("fourth") or "").strip() or None
                if fourth:
                    loc, dates = third, fourth
                else:
                    loc, dates = None, third or ""
                current_job = Job(
                    company=m.group("company").strip(),
                    url=m.group("url").strip(),
                    role=m.group("role").strip(),
                    location=loc,
                    dates=dates,
                )
                i += 1
                continue
            stack_match = STACK_LINE_RE.match(line)
            if current_job is not None and current_job.stack is None and stack_match:
                current_job.stack = stack_match.group("value").strip()
                i += 1
                continue
            # italic stack line: `*...*` or `_..._`
            if current_job is not None and current_job.stack is None and (
                (line.startswith("*") and line.endswith("*") and not line.startswith("**"))
                or (line.startswith("_") and line.endswith("_"))
            ):
                current_job.stack = line.strip("*_").strip()
                i += 1
                continue
            # bullet
            if current_job is not None and line.startswith("- "):
                current_job.bullets.append(line[2:].strip())
                i += 1
                continue
            i += 1
            continue

        i += 1

    flush_job()
    return r


def _strip_inline_md(text: str) -> str:
    """Keep **bold** and *italic* as HTML for reportlab Paragraphs."""
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<link href="\2">\1</link>', text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<i>\1</i>", text)
    return text


def _assign_contact(c: Contact, rest: str):
    low = rest.lower()
    if low.startswith("email:"):
        c.email = rest.split(":", 1)[1].strip()
    elif low.startswith("phone:"):
        c.phone = rest.split(":", 1)[1].strip()
    elif low.startswith("location:"):
        c.location = rest.split(":", 1)[1].strip()
    elif "linkedin.com/" in low:
        c.linkedin = rest
    elif "github.com/" in low:
        c.github = rest
    elif "citizen" in low:
        c.citizenship = rest
    else:
        # assume bare domain -> website
        if re.match(r"^[a-z0-9.\-]+\.[a-z]{2,}(/.*)?$", rest, re.I):
            c.website = rest


# Avatar -> circular PNG
def circular_avatar_png(src_path: Path, dest_path: Path, size_px: int = 512) -> Path:
    im = Image.open(src_path).convert("RGBA")
    side = min(im.size)
    left = (im.width - side) // 2
    top = (im.height - side) // 2
    im = im.crop((left, top, left + side, top + side)).resize(
        (size_px, size_px), Image.LANCZOS
    )
    mask = Image.new("L", (size_px, size_px), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size_px, size_px), fill=255)
    im.putalpha(mask)
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest_path)
    return dest_path


# Decorative primitives drawn on canvas
def draw_sparkle(c, cx, cy, size=3.0, color=CORAL):
    c.saveState()
    c.setFillColor(color)
    c.setStrokeColor(color)
    c.setLineWidth(0.3)
    long_ = size
    short_ = size * 0.30
    p = c.beginPath()
    p.moveTo(cx, cy + long_)
    p.lineTo(cx + short_, cy + short_)
    p.lineTo(cx + long_, cy)
    p.lineTo(cx + short_, cy - short_)
    p.lineTo(cx, cy - long_)
    p.lineTo(cx - short_, cy - short_)
    p.lineTo(cx - long_, cy)
    p.lineTo(cx - short_, cy + short_)
    p.close()
    c.drawPath(p, stroke=0, fill=1)
    c.restoreState()


def draw_sprig(c, cx, cy, scale=1.0, color=SAGE):
    c.saveState()
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(0.9)
    c.setLineCap(1)
    p = c.beginPath()
    p.moveTo(cx, cy)
    p.curveTo(cx + 6 * scale, cy + 4 * scale,
              cx + 12 * scale, cy + 10 * scale,
              cx + 18 * scale, cy + 18 * scale)
    c.drawPath(p, stroke=1, fill=0)
    for (lx, ly, rot) in [
        (cx + 4 * scale, cy + 5 * scale, 20),
        (cx + 10 * scale, cy + 10 * scale, 30),
        (cx + 16 * scale, cy + 16 * scale, 40),
    ]:
        c.saveState()
        c.translate(lx, ly)
        c.rotate(rot)
        c.ellipse(-3.5 * scale, -1.3 * scale, 3.5 * scale, 1.3 * scale,
                  stroke=0, fill=1)
        c.restoreState()
    c.restoreState()


def draw_wave(c, x0, x1, y, color=TEAL, width=0.6, amplitude=1.2, wavelength=22):
    c.saveState()
    c.setStrokeColor(color)
    c.setLineWidth(width)
    c.setLineCap(1)
    p = c.beginPath()
    steps = max(2, int((x1 - x0) / 2))
    for i in range(steps + 1):
        t = i / steps
        x = x0 + (x1 - x0) * t
        yy = y + amplitude * math.sin(2 * math.pi * (x - x0) / wavelength)
        (p.moveTo if i == 0 else p.lineTo)(x, yy)
    c.drawPath(p, stroke=1, fill=0)
    c.restoreState()


# Page + styles
PAGE_W, PAGE_H = LETTER
L_MARGIN = 0.6 * inch
R_MARGIN = 0.6 * inch
T_MARGIN = 0.55 * inch
B_MARGIN = 0.6 * inch


def paint_page(c, doc):
    y = 0.42 * inch
    draw_wave(c, L_MARGIN, PAGE_W - R_MARGIN - 0.4 * inch, y)
    draw_sprig(c, PAGE_W - R_MARGIN - 0.35 * inch, y - 4, scale=0.9)
    draw_sparkle(c, L_MARGIN - 2, y, size=2.2)
    c.saveState()
    c.setFont("Helvetica", 7.5)
    c.setFillColor(MUTED)
    c.drawCentredString(PAGE_W / 2, 0.28 * inch, f"- {doc.page} -")
    c.restoreState()


def build_styles():
    base = "Helvetica"
    bold = "Helvetica-Bold"
    italic = "Helvetica-Oblique"
    return dict(
        name=ParagraphStyle("Name", fontName=bold, fontSize=22, leading=25,
                            textColor=TEAL, spaceAfter=2),
        tagline=ParagraphStyle("Tag", fontName=italic, fontSize=10.5,
                               leading=13, textColor=MUTED, spaceAfter=6),
        contact=ParagraphStyle("Contact", fontName=base, fontSize=8.8,
                               leading=12.2, textColor=INK, spaceAfter=1),
        body=ParagraphStyle("Body", fontName=base, fontSize=9.6, leading=13.2,
                            textColor=INK, spaceAfter=5),
        h2=ParagraphStyle("H2", fontName=bold, fontSize=12, leading=15,
                          textColor=TEAL, spaceBefore=10, spaceAfter=4),
        job_header=ParagraphStyle("JH", fontName=bold, fontSize=10.2,
                                  leading=13.4, textColor=INK,
                                  spaceBefore=6, spaceAfter=1),
        stack=ParagraphStyle("Stack", fontName=italic, fontSize=8.9,
                             leading=11.4, textColor=MUTED, spaceAfter=3),
        bullet=ParagraphStyle("Bul", fontName=base, fontSize=9.5, leading=12.6,
                              textColor=INK, leftIndent=10, bulletIndent=0,
                              spaceAfter=1.2),
        skills=ParagraphStyle("Sk", fontName=base, fontSize=9.5, leading=13,
                              textColor=INK, spaceAfter=2),
        evidence=ParagraphStyle("Ev", fontName=base, fontSize=9.1, leading=12.2,
                                textColor=INK, leftIndent=10, bulletIndent=0,
                                spaceAfter=2),
        compact=ParagraphStyle("Cmp", fontName=base, fontSize=9.3, leading=12.3,
                               textColor=INK, spaceAfter=2),
    )


class SectionHeading(Flowable):
    def __init__(self, text, style):
        super().__init__()
        self.text = text
        self.style = style
        self._para = Paragraph(text, style)
        self.width_ = 0

    def wrap(self, avail_w, avail_h):
        self.width_ = avail_w
        _, h = self._para.wrap(avail_w - 14, avail_h)
        self._h = h + 9
        return avail_w, self._h

    def draw(self):
        draw_sparkle(self.canv, 3, self._h - 11, size=2.8, color=CORAL)
        self._para.drawOn(self.canv, 12, 7)
        self.canv.saveState()
        self.canv.setStrokeColor(TEAL)
        self.canv.setLineWidth(0.55)
        self.canv.line(12, 2, self.width_ - 2, 2)
        self.canv.restoreState()


class WaveDivider(Flowable):
    def __init__(self, w):
        super().__init__()
        self.w = w

    def wrap(self, aw, ah):
        return aw, 6

    def draw(self):
        draw_wave(self.canv, 0, self.w, 3, color=TEAL, width=0.6,
                  amplitude=1.1, wavelength=26)
        draw_sparkle(self.canv, self.w / 2, 3, size=2.4, color=CORAL)


# Story assembly
def teal_link(text: str, href: Optional[str] = None, bold: bool = False) -> str:
    body = f"<b>{text}</b>" if bold else text
    inner = f'<font color="#1E5F6B">{body}</font>'
    if href:
        return f'<link href="{href}">{inner}</link>'
    return inner


def normalize_url(raw: str) -> str:
    if raw.startswith(("http://", "https://")):
        return raw
    return f"https://{raw}"


def build_header(styles, resume: Resume, avatar_png: Path,
                 inner_w: float) -> Table:
    c = resume.contact
    dot = '<font color="#1E5F6B">◆</font>'
    dot3 = '<font color="#7A9A6B">◆</font>'
    pieces = []
    if c.email:
        pieces.append(f"{dot}&nbsp; {c.email}")
    # Phone is intentionally never rendered. See module docstring.
    loc_parts = []
    if c.location:
        loc_parts.append(c.location)
    if c.citizenship:
        loc_parts.append(c.citizenship)
    if loc_parts:
        pieces.append(f"{dot3}&nbsp; " + " · ".join(loc_parts))
    contact_line1 = "&nbsp;&nbsp;".join(pieces)

    link_pieces = []
    if c.website:
        link_pieces.append(teal_link(c.website, normalize_url(c.website)))
    if c.linkedin:
        link_pieces.append(teal_link(c.linkedin, normalize_url(c.linkedin)))
    if c.github:
        link_pieces.append(teal_link(c.github, normalize_url(c.github)))
    contact_line2 = "&nbsp;·&nbsp;".join(link_pieces)

    tagline = (
        "Senior platform engineer - governed AI systems, developer "
        "infrastructure, and production platforms."
    )

    left_cell = [
        Paragraph(resume.name, styles["name"]),
        Paragraph(tagline, styles["tagline"]),
        Paragraph(contact_line1, styles["contact"]),
        Paragraph(contact_line2, styles["contact"]),
    ]

    av_size = 0.95 * inch
    avatar_img = RLImage(str(avatar_png), width=av_size, height=av_size)
    col_text = inner_w - av_size - 0.18 * inch
    t = Table(
        [[left_cell, avatar_img]],
        colWidths=[col_text, av_size + 0.18 * inch],
        hAlign="LEFT",
    )
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


def render_job_block(styles, j: Job) -> KeepTogether:
    dates_loc = f" | {j.location} · {j.dates}" if j.location else f" | {j.dates}"
    parts = [Paragraph(
        teal_link(j.company, j.url, bold=True)
        + f" &nbsp;·&nbsp; <b>{j.role}</b>"
        + f' &nbsp;<font color="#6B6B6B">{dates_loc}</font>',
        styles["job_header"],
    )]
    if j.stack:
        parts.append(Paragraph(j.stack, styles["stack"]))
    for b in j.bullets:
        parts.append(Paragraph(f"• {b}", styles["bullet"]))
    return KeepTogether(parts)


def render_compact_job(styles, j: Job) -> Paragraph:
    dates = j.dates
    extras = f" | {dates}" if dates else ""
    stack = (
        f' &nbsp; <i><font color="#6B6B6B">{j.stack}</font></i>' if j.stack else ""
    )
    html = (
        teal_link(j.company, j.url, bold=True)
        + f" &nbsp;·&nbsp; {j.role}"
        + f' &nbsp;<font color="#6B6B6B">{extras}</font>'
        + stack
    )
    return Paragraph(html, styles["compact"])


def build_story(styles, resume: Resume, avatar_png: Path,
                content_width: float) -> list:
    story: list = []
    story.append(build_header(styles, resume, avatar_png, content_width))
    story.append(Spacer(1, 4))
    story.append(WaveDivider(content_width))
    story.append(Spacer(1, 6))

    for p in resume.summary:
        story.append(Paragraph(p, styles["body"]))

    if resume.evidence:
        story.append(SectionHeading("Current Open Source", styles["h2"]))
        for _label, value in resume.evidence:
            story.append(Paragraph(
                f"• {value}",
                styles["evidence"],
            ))

    if resume.skills:
        story.append(SectionHeading("Skills", styles["h2"]))
        for label, value in resume.skills:
            value = value.replace(", ", " · ")
            story.append(Paragraph(
                f'<b><font color="#1E5F6B">{label}</font></b> &nbsp; {value}',
                styles["skills"],
            ))

    if resume.jobs:
        story.append(SectionHeading("Experience", styles["h2"]))
        # split: full entries (with bullets) vs compact (no bullets)
        full_jobs = [j for j in resume.jobs if j.bullets]
        compact_jobs = [j for j in resume.jobs if not j.bullets]
        for j in full_jobs:
            story.append(render_job_block(styles, j))
        if compact_jobs:
            story.append(Spacer(1, 2))
            for j in compact_jobs:
                story.append(render_compact_job(styles, j))

    if resume.community:
        story.append(SectionHeading("Community &amp; Open Source Leadership",
                                    styles["h2"]))
        for j in resume.community:
            story.append(render_job_block(styles, j))

    return story


# Build
def build_pdf(source: Path, outs: list[Path], avatar: Path):
    resume = parse_resume(source.read_text(encoding="utf-8"))
    # Defensive scrub: even if Resume.md contains a phone, never render it.
    resume.contact.phone = None
    styles = build_styles()
    content_width = PAGE_W - L_MARGIN - R_MARGIN

    # cache circular avatar next to this script (gitignored, never shipped)
    cache_dir = Path(__file__).resolve().parent / ".cache"
    avatar_png = circular_avatar_png(avatar, cache_dir / "avatar-circle.png",
                                     size_px=512)

    for out in outs:
        out.parent.mkdir(parents=True, exist_ok=True)
        frame = Frame(
            L_MARGIN, B_MARGIN, content_width,
            PAGE_H - B_MARGIN - T_MARGIN,
            leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
            id="main",
        )
        doc = BaseDocTemplate(
            str(out),
            pagesize=LETTER,
            leftMargin=L_MARGIN, rightMargin=R_MARGIN,
            topMargin=T_MARGIN, bottomMargin=B_MARGIN,
            title=f"{resume.name} - Resume",
            author=resume.name,
            subject="Resume",
            creator="coilysiren",
        )
        doc.addPageTemplates([
            PageTemplate(id="main", frames=[frame], onPage=paint_page),
        ])
        story = build_story(styles, resume, avatar_png, content_width)
        doc.build(story)
        size = out.stat().st_size
        print(f"wrote {out} ({size:,} bytes)")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Build resume PDF from Resume.md")
    ap.add_argument("--source", type=Path, default=DEFAULT_SOURCE,
                    help=f"Markdown source (default: {DEFAULT_SOURCE})")
    ap.add_argument("--out", type=Path, action="append", dest="outs",
                    help="Output PDF path. Pass multiple times to write to "
                         "several locations in one run. "
                         f"Default if omitted: {DEFAULT_OUTPUT}")
    ap.add_argument("--avatar", type=Path, default=DEFAULT_AVATAR,
                    help=f"Avatar image (default: {DEFAULT_AVATAR})")
    args = ap.parse_args(argv)

    outs = args.outs or [DEFAULT_OUTPUT]

    if not args.source.exists():
        print(f"source not found: {args.source}", file=sys.stderr)
        return 1
    if not args.avatar.exists():
        print(f"avatar not found: {args.avatar}", file=sys.stderr)
        return 1

    build_pdf(args.source, outs, args.avatar)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
