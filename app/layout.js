import './globals.css';
import fs from 'fs';
import path from 'path';

export const metadata = {
  title: 'AquaLog | MedStar Health',
  description: 'Water Chemistry Tracking Portal for MedStar Health Hospitals',
};

function getGlobalTheme() {
  try {
    const f = path.join(process.cwd(), 'data', 'theme.json');
    if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch {}
  return { primary: '#0072CE', navy: '#003366', accent: '#F6C90E', mode: 'light' };
}

export default function RootLayout({ children }) {
  const theme = getGlobalTheme();
  const isDark = theme.mode === 'dark';

  const cssVars = `
    :root {
      --navy:         ${theme.navy};
      --FacilityH2O-blue: ${theme.primary};
      --accent:       ${theme.accent || '#F6C90E'};
    }
  `;

  return (
    <html lang="en" className={isDark ? 'dark' : ''}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        {/* Allow personal dark/light override on top of global theme */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var personal = localStorage.getItem('FacilityH2O-theme-override');
              if (personal === 'dark') document.documentElement.classList.add('dark');
              else if (personal === 'light') document.documentElement.classList.remove('dark');
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        {children}
      </body>
    </html>
  );
}
