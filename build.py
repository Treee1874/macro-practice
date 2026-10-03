from pathlib import Path

root = Path(__file__).resolve().parent
html = (root / 'shell.html').read_text(encoding='utf-8')
for token, filename in [('/*__STYLES__*/', 'styles.css'), ('/*__BANK__*/', 'bank.js'), ('/*__APP__*/', 'app.js')]:
    text = (root / filename).read_text(encoding='utf-8')
    if '</script' in text.lower():
        raise ValueError('Embedded scripts must not contain closing script tags')
    html = html.replace(token, text)
(root / 'index.html').write_text(html, encoding='utf-8')
print('Built standalone index.html')
