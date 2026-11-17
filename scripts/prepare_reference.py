import zipfile, re, shutil, os, sys
src = '.tools/reference-default.docx'
dst = '.tools/reference-landscape.docx'
zin = zipfile.ZipFile(src)
items = {n: zin.read(n) for n in zin.namelist()}
zin.close()

doc = items['word/document.xml'].decode('utf-8')
sect = ('<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>'
        '<w:pgMar w:top="850" w:right="850" w:bottom="850" w:left="850" '
        'w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>')
doc2, n = re.subn(r'<w:sectPr>.*?</w:sectPr>', sect, doc, count=1, flags=re.S)
print('sectPr replaced', n)
items['word/document.xml'] = doc2.encode('utf-8')

styles = items['word/styles.xml'].decode('utf-8')
# Base font -> Liberation Sans (installed) for a clean sans-serif report
styles = re.sub(r'w:ascii="[^"]*"', 'w:ascii="Liberation Sans"', styles)
styles = re.sub(r'w:hAnsi="[^"]*"', 'w:hAnsi="Liberation Sans"', styles)
styles = re.sub(r'w:eastAsia="[^"]*"', 'w:eastAsia="Liberation Sans"', styles)
styles = re.sub(r'w:cs="[^"]*"', 'w:cs="Liberation Sans"', styles)
items['word/styles.xml'] = styles.encode('utf-8')

with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED) as zout:
    for n, b in items.items():
        zout.writestr(n, b)
print('wrote', dst)
