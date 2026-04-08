import os

base = r'C:\Users\antoi\.openclaw\workspace\aqualog'
pages = [
    'app/alerts/page.js', 'app/audit/page.js', 'app/compliance/page.js',
    'app/dashboard/page.js', 'app/directory/page.js', 'app/entry/page.js',
    'app/history/page.js', 'app/legal/page.js', 'app/reports/page.js',
    'app/trends/page.js', 'app/users/page.js'
]

replacements = [
    ('className="flex-1 p-8"', 'className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8"'),
    ('className="flex-1 p-8 max-w-3xl"', 'className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8 max-w-3xl"'),
    ('className="flex-1 p-8 max-w-4xl"', 'className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8 max-w-4xl"'),
]

for page in pages:
    fp = os.path.join(base, page.replace('/', os.sep))
    if not os.path.exists(fp):
        print(f'SKIP: {fp}')
        continue
    with open(fp, encoding='utf-8') as f:
        content = f.read()
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
    if content != original:
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated: {page}')
    else:
        print(f'No match: {page}')
