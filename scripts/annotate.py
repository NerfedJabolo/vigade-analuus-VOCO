#!/usr/bin/env python3
"""Lisab tõenduspiltidele defekti ID, konteksti ja vajadusel punase raami."""
from PIL import Image, ImageDraw, ImageFont
import os
import textwrap

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EV = os.path.join(BASE, "evidence", "final")
OUT = os.path.join(BASE, "evidence", "annotated")
os.makedirs(OUT, exist_ok=True)

BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def font(path, size):
    return ImageFont.truetype(path, size)


SPECS = [
    {
        "id": "PL-01",
        "src": "PL-01-clean.png",
        "title": "PL-01 — Ostukorvi ikoonlink ja karusselli nooled on nimeta",
        "lines": [
            "Punasega tähistatud: päise ostukorv (a[data-cy=shopping-cart]) ja karusselli eelmine/järgmine nupp.",
            "AX-puus on nende nimi tühi (26 nimeta linki/nuppu).",
        ],
        "rects": [],
    },
    {
        "id": "PL-02",
        "src": "PL-02-clean.png",
        "title": "PL-02 — Uudiskirja vea korral fookus ei liigu ja veateade pole live-regioon",
        "lines": [
            "Sisestatud „abc“, vajutatud „Liitun“. Veateade on nähtav (punane raam), kuid fookus jääb nupule (sinine katkendlik raam).",
            "Veateate elemendil puudub role=alert / aria-live; input aria-invalid=true on olemas.",
        ],
        "rects": [],
    },
    {
        "id": "PL-03",
        "src": "PL-03-clean.png",
        "title": "PL-03 — Ühemärgiline otsing ei anna tagasisidet",
        "lines": [
            "Otsingusse sisestatud „a“ ja vajutatud Enter. URL jääb https://www.piletilevi.ee/ , teadet ei kuvata.",
        ],
        "rects": [],
    },
    {
        "id": "PL-04",
        "src": "PL-04.png",
        "title": "PL-04 — Koguse „−“ nupp on 0 juures aktiivne, kuid ei tee midagi",
        "lines": [
            "Kogus on 0, kuid decrement-button disabled=false; klikk jätab koguse 0-ks.",
        ],
        "rects": [(1028, 446, 64, 64)],
        "label": "disabled=false",
        "label_xy": (1010, 420),
    },
    {
        "id": "PL-05",
        "src": "PL-05.png",
        "title": "PL-05 — Filtri rakendamisel tekib URL-i duplikaatne date parameeter",
        "lines": [
            "Filtritega „Täna“ + „Näita“ tekib URL:",
            "…/search?query=kontsert&date=2026-11-17&date=2026-11-17&sortOrder=score&page=1",
        ],
        "rects": [],
    },
    {
        "id": "EL-01",
        "src": "EL-01b.png",
        "title": "EL-01 — Otsinguväljal Enter ei käivita otsingut",
        "lines": [
            "Sisestatud „iphone“, vajutatud Enter. URL jääb https://www.elisa.ee/ ; tulemuste lehele viib alles „Veel tulemusi...“",
            "(klikk → https://www.elisa.ee/et/otsing?search=iphone).",
        ],
        "rects": [],
    },
    {
        "id": "EL-02",
        "src": "EL-02-focus.png",
        "title": "EL-02 — Skip-link ei vii põhisisu juurde",
        "lines": [
            "Tab → fookus skip-lingil „Liigu edasi põhisisu juurde“ (href=/#skip-to-main-content).",
            "Enter viib teisele skip-lingile (href=#), mitte <main>-sisu juurde.",
        ],
        "rects": [],
    },
    {
        "id": "EL-03",
        "src": "EL-03b.png",
        "title": "EL-03 — Tootelehel puudub H1",
        "lines": [
            "Toote nimi „Apple iPhone Duo 512GB“ on suur, kuid DOM-is div; h1Elemente on 0.",
        ],
        "rects": [(724, 140, 480, 72)],
        "label": "<div>, mitte <h1>",
        "label_xy": (724, 112),
    },
    {
        "id": "EL-05",
        "src": "EL-05b.png",
        "title": "EL-05 — Ostukorvi nupu aria-label on ingliskeelne",
        "lines": [
            "Eestikeelsel lehel on ostukorvi nupu aria-label „Shopping cart, 0 items in cart“.",
        ],
        "rects": [],
    },
    {
        "id": "EL-06",
        "src": "EL-06b.png",
        "title": "EL-06 — Otsingu autocomplete'il puudub combobox-semantika",
        "lines": [
            "Soovitused on nähtavad, kuid input on role=textbox: aria-expanded, aria-controls, aria-autocomplete,",
            "aria-activedescendant ja listbox/option rollid puuduvad.",
        ],
        "rects": [],
    },
]


def wrap(draw, text, f, maxw):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=f) <= maxw:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


for spec in SPECS:
    path = os.path.join(EV, spec["src"])
    if not os.path.exists(path):
        print("missing", path)
        continue
    im = Image.open(path).convert("RGB")
    W, H = im.size
    draw = ImageDraw.Draw(im)

    for (x, y, w, h) in spec.get("rects", []):
        draw.rectangle([x, y, x + w, y + h], outline=(255, 0, 0), width=4)

    if spec.get("label"):
        f = font(BOLD, 18)
        tx, ty = spec["label_xy"]
        tw = draw.textlength(spec["label"], font=f)
        draw.rectangle([tx - 4, ty - 3, tx + tw + 4, ty + 24], fill=(255, 255, 255))
        draw.text((tx, ty), spec["label"], font=f, fill=(200, 0, 0))

    # footer
    f_title = font(BOLD, 21)
    f_line = font(REG, 16)
    f_meta = font(REG, 13)
    maxw = W - 40
    title_lines = wrap(draw, spec["title"], f_title, maxw)
    body_lines = []
    for line in spec["lines"]:
        body_lines.extend(wrap(draw, line, f_line, maxw))
    footer_h = 14 + 26 * len(title_lines) + 4 + 22 * len(body_lines) + 22
    canvas = Image.new("RGB", (W, H + footer_h), (245, 245, 245))
    canvas.paste(im, (0, 0))
    d = ImageDraw.Draw(canvas)
    d.line([(0, H), (W, H)], fill=(160, 160, 160), width=2)
    y = H + 10
    for line in title_lines:
        d.text((20, y), line, font=f_title, fill=(20, 20, 20))
        y += 26
    y += 2
    for line in body_lines:
        d.text((20, y), line, font=f_line, fill=(45, 45, 45))
        y += 22
    d.text(
        (20, y + 2),
        "Test: 17.11.2026 · Sten · Chromium 158 (Playwright 1.65) · 1440×900 · tõend: evidence/final/"
        + spec["src"],
        font=f_meta,
        fill=(90, 90, 90),
    )
    out = os.path.join(OUT, f"{spec['id']}.png")
    canvas.save(out, quality=92)
    print("wrote", out, canvas.size)
