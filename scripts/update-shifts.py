import os, re

base = r'C:\Users\antoi\.openclaw\workspace\aqualog'

# All replacements to make across the codebase
replacements = [
    # Shift time labels
    ("Day (7a–3p)",     "1st Shift (5a–1:30p)"),
    ("Evening (3p–11p)","2nd Shift (1p–9:30p)"),
    ("Night (11p–7a)",  "3rd Shift (9p–5:30a)"),
    # Short variants
    ("Day shift (7a–3p)",      "1st Shift (5a–1:30p)"),
    ("Evening shift (3p–11p)", "2nd Shift (1p–9:30p)"),
    ("Night shift (11p–7a)",   "3rd Shift (9p–5:30a)"),
    # Check-shifts route old times
    ("'5:00 AM - 1:30 PM'",  "'5:00 AM – 1:30 PM'"),
    ("'1:00 PM - 9:30 PM'",  "'1:00 PM – 9:30 PM'"),
    ("'9:00 PM - 5:00 AM'",  "'9:00 PM – 5:30 AM'"),
    # Email/report time strings
    ("Day: '5:00 AM – 1:30 PM'",     "Day: '5:00 AM – 1:30 PM'"),
    ("Evening: '1:00 PM – 9:30 PM'", "Evening: '1:00 PM – 9:30 PM'"),
    ("Night: '9:00 PM – 5:30 AM'",   "Night: '9:00 PM – 5:30 AM'"),
    # Shift option labels in forms
    ("'Day', 'Evening', 'Night'", "'1st Shift', '2nd Shift', '3rd Shift'"),
    # Python-style option arrays
    ("<option>Day</option><option>Evening</option><option>Night</option>",
     "<option>1st Shift</option><option>2nd Shift</option><option>3rd Shift</option>"),
]

# Walk all JS files
updated_files = []
for root, dirs, files in os.walk(base):
    dirs[:] = [d for d in dirs if d not in ['.next', 'node_modules', '.git']]
    for fname in files:
        if not fname.endswith('.js') and not fname.endswith('.md'):
            continue
        fp = os.path.join(root, fname)
        try:
            with open(fp, encoding='utf-8') as f:
                content = f.read()
        except:
            continue
        original = content
        for old, new in replacements:
            content = content.replace(old, new)
        if content != original:
            with open(fp, 'w', encoding='utf-8') as f:
                f.write(content)
            rel = os.path.relpath(fp, base)
            updated_files.append(rel)

print(f"Updated {len(updated_files)} files:")
for f in updated_files:
    print(f"  {f}")
