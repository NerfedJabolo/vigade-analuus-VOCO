#!/usr/bin/env python3
"""Pandoci DOCX-i järeltöötlus: font, tabelilaiused, reavahe ja rea terviklikkus."""
import re
import sys
import zipfile

SRC = sys.argv[1] if len(sys.argv) > 1 else 'report/veaaruanded.docx'
DST = sys.argv[2] if len(sys.argv) > 2 else 'report/veaaruanded-final.docx'

CONTENT_W = 15398  # twips, A4 landscape with 850 twip margins

PROFILES = [
    [30, 70],                          # cover
    [10, 14, 6, 6, 6, 6, 52],          # summary
    [22, 78],                          # methodology
    [14, 58, 28],                      # priorities
    None,                              # PL table (9)
    None,                              # EL table (9)
    [8, 38, 30, 24],                   # additional observations
    [8, 45, 33, 14],                   # sprint plan
    [28, 50, 22],                      # regression tests
    [10, 45, 45],                      # evidence files
    [32, 68],                          # scripts
]

W9 = [800, 2850, 2900, 2050, 2050, 800, 2250, 1000, 698]


def widths_for(idx, cols):
    prof = PROFILES[idx] if idx < len(PROFILES) else None
    if cols == 9:
        return W9
    if prof and len(prof) == cols:
        vals = [int(CONTENT_W * p / 100) for p in prof]
    else:
        vals = [CONTENT_W // cols] * cols
    vals[-1] += CONTENT_W - sum(vals)
    return vals


def shrink_table_runs(block, size=15):
    # Lisa kõigile tabeli runidele 7,5 pt suurus.
    block = re.sub(r'<w:r>(?!<w:rPr>)', f'<w:r><w:rPr><w:sz w:val="{size}"/><w:szCs w:val="{size}"/></w:rPr>', block)

    def add_sz(m):
        rpr = m.group(0)
        if '<w:sz ' in rpr:
            return rpr
        return rpr.replace('</w:rPr>', f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/></w:rPr>')

    return re.sub(r'<w:rPr>.*?</w:rPr>', add_sz, block, flags=re.S)


def process_tables(xml):
    idx = 0
    out = []
    pos = 0
    for m in re.finditer(r'<w:tbl>.*?</w:tbl>', xml, flags=re.S):
        out.append(xml[pos:m.start()])
        block = m.group(0)
        cols = block.count('<w:gridCol')
        widths = widths_for(idx, cols)

        block = re.sub(r'<w:tblW[^/]*/>', '<w:tblW w:type="pct" w:w="5000"/>', block, count=1)
        if '<w:tblLayout' not in block:
            block = block.replace('<w:tblW w:type="pct" w:w="5000"/>',
                                  '<w:tblW w:type="pct" w:w="5000"/><w:tblLayout w:type="fixed"/>', 1)

        grid = '<w:tblGrid>' + ''.join(f'<w:gridCol w:w="{w}"/>' for w in widths) + '</w:tblGrid>'
        block = re.sub(r'<w:tblGrid>.*?</w:tblGrid>', grid, block, count=1, flags=re.S)

        # Lisa tcW igasse lahtrisse, järjestikku veergude kaupa.
        ci = 0

        def tc_repl(mm):
            nonlocal ci
            w = widths[ci % cols]
            ci += 1
            return f'<w:tcW w:w="{w}" w:type="dxa"/>'

        block = re.sub(r'<w:tcW[^/]*/>', tc_repl, block)
        if '<w:tcW' not in block:
            # Pandoc jätab tcPr tihti tühjaks; lisa tcW esimesse lahtrisse.
            ci = 0

            def tcpr_repl(mm):
                nonlocal ci
                w = widths[ci % cols]
                ci += 1
                return f'<w:tcPr><w:tcW w:w="{w}" w:type="dxa"/></w:tcPr>'

            block = re.sub(r'<w:tcPr\s*/>', tcpr_repl, block)

        # Väldi rea murdumist lehe vahel; hoia päis korduv.
        block = re.sub(r'<w:tr>(?!<w:trPr>)', '<w:tr><w:trPr><w:cantSplit/></w:trPr>', block)
        block = block.replace('<w:trPr>', '<w:trPr><w:cantSplit/>')
        block = block.replace('<w:trPr><w:cantSplit/><w:cantSplit/>', '<w:trPr><w:cantSplit/>')
        if '<w:tblHeader' not in block:
            block = block.replace('<w:tr><w:trPr><w:cantSplit/></w:trPr>',
                                  '<w:tr><w:trPr><w:cantSplit/><w:tblHeader w:val="on"/></w:trPr>', 1)

        sizes = [20, 18, 18, 18, 15, 15, 16, 16, 18, 16, 16]
        block = shrink_table_runs(block, sizes[idx] if idx < len(sizes) else 16)
        out.append(block)
        pos = m.end()
        idx += 1
    out.append(xml[pos:])
    return ''.join(out), idx


zin = zipfile.ZipFile(SRC)
items = {n: zin.read(n) for n in zin.namelist()}
zin.close()

doc = items['word/document.xml'].decode('utf-8')
doc, ntables = process_tables(doc)
items['word/document.xml'] = doc.encode('utf-8')
print('tables processed:', ntables)

styles = items['word/styles.xml'].decode('utf-8')

# Ühtne sans-serif font kogu dokumendis.
def font_repl(m):
    return ('<w:rFonts w:ascii="Liberation Sans" w:hAnsi="Liberation Sans" '
            'w:eastAsia="Liberation Sans" w:cs="Liberation Sans"/>')

styles = re.sub(r'<w:rFonts[^/]*/>', font_repl, styles)
styles = re.sub(r'<w:sz w:val="24"\s*/>', '<w:sz w:val="21"/>', styles, count=1)
styles = re.sub(r'<w:szCs w:val="24"\s*/>', '<w:szCs w:val="21"/>', styles, count=1)

# Tabeli lahtrite vahed väiksemaks.
styles = re.sub(r'<w:tblCellMar>.*?</w:tblCellMar>',
                '<w:tblCellMar><w:top w:type="dxa" w:w="30"/>'
                '<w:left w:type="dxa" w:w="60"/>'
                '<w:bottom w:type="dxa" w:w="30"/>'
                '<w:right w:type="dxa" w:w="60"/></w:tblCellMar>',
                styles, count=1, flags=re.S)
mono = ('<w:rFonts w:ascii="DejaVu Sans Mono" w:hAnsi="DejaVu Sans Mono" '
        'w:eastAsia="DejaVu Sans Mono" w:cs="DejaVu Sans Mono"/>')
styles = re.sub(
    r'(<w:style [^>]*w:styleId="SourceCode"[^>]*>)(.*?)(</w:style>)',
    lambda m: m.group(1) + m.group(2) + '<w:rPr>' + mono + '<w:sz w:val="18"/></w:rPr>' + m.group(3),
    styles, flags=re.S)
styles = re.sub(
    r'(<w:style [^>]*w:styleId="VerbatimChar"[^>]*>)(.*?)(</w:style>)',
    lambda m: m.group(1) + re.sub(r'<w:rFonts[^/]*/>', mono, m.group(2)).replace('<w:sz w:val="22" />', '<w:sz w:val="18" />') + m.group(3),
    styles, flags=re.S)
items['word/styles.xml'] = styles.encode('utf-8')



# Eemalda tühjad lehevahetusparagrahvid ja kasuta pageBreakBefore ainult valitud H1-del.
doc = items['word/document.xml'].decode('utf-8')
doc = doc.replace('<w:p><w:r><w:br w:type="page"/></w:r></w:p>', '')
for title in ['Kokkuvõte', 'Rakendus 1: Piletilevi', 'Rakendus 2: Elisa',
              'Täiendavad tähelepanekud', 'Soovitused ja parandusplaan', 'Lisa A. Tõendifailid']:
    pat = ('<w:p><w:pPr><w:pStyle w:val="Heading1" /></w:pPr>'
           '<w:r><w:t xml:space="preserve">' + title + '</w:t></w:r></w:p>')
    rep = ('<w:p><w:pPr><w:pStyle w:val="Heading1" /><w:pageBreakBefore /></w:pPr>'
           '<w:r><w:t xml:space="preserve">' + title + '</w:t></w:r></w:p>')
    doc = doc.replace(pat, rep, 1)
# Pealkirja vertikaalne asetus tiitellehel.
doc = doc.replace('<w:pStyle w:val="Title" />', '<w:pStyle w:val="Title" /><w:spacing w:before="1800" w:after="160" />', 1)
doc = doc.replace('<w:pStyle w:val="Subtitle" />', '<w:pStyle w:val="Subtitle" /><w:spacing w:after="240" />', 1)
items['word/document.xml'] = doc.encode('utf-8')

# --- Footer with page number -------------------------------------------------
footer_xml = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  '<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
  '<w:p><w:pPr><w:jc w:val="right"/></w:pPr>'
  '<w:r><w:rPr><w:sz w:val="16"/><w:color w:val="808080"/></w:rPr>'
  '<w:t xml:space="preserve">Veebirakenduste veaaruanded · 17.11.2026 · lk </w:t></w:r>'
  '<w:fldSimple w:instr=" PAGE "><w:r><w:rPr><w:sz w:val="16"/><w:color w:val="808080"/></w:rPr>'
  '<w:t>1</w:t></w:r></w:fldSimple></w:p></w:ftr>')
items['word/footer1.xml'] = footer_xml.encode('utf-8')

rels = items['word/_rels/document.xml.rels'].decode('utf-8')
if 'footer1.xml' not in rels:
    rels = rels.replace('</Relationships>',
        '<Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>')
items['word/_rels/document.xml.rels'] = rels.encode('utf-8')

ct = items['[Content_Types].xml'].decode('utf-8')
if 'footer1.xml' not in ct:
    ct = ct.replace('</Types>',
        '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>')
items['[Content_Types].xml'] = ct.encode('utf-8')

doc = items['word/document.xml'].decode('utf-8')
if 'footerReference' not in doc:
    doc = doc.replace('<w:sectPr>', '<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter1"/>', 1)
items['word/document.xml'] = doc.encode('utf-8')

with zipfile.ZipFile(DST, 'w', zipfile.ZIP_DEFLATED) as zout:
    for n, b in items.items():
        zout.writestr(n, b)
print('wrote', DST)
