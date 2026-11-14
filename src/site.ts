import { resolveRoles, type Palette } from './themes/palette';

export function starterSite(title: string, palette: Palette): string {
  const safe = title.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
  const { background, surface, foreground, accent } = resolveRoles(palette);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safe}</title>
<style>
body { margin: 0; padding: 2rem; background: ${background}; color: ${foreground}; font: 1rem/1.6 system-ui; }
main { max-width: 48rem; margin: 10vh auto; padding: 2rem; background: ${surface}; border: 2px solid ${accent}; border-radius: 1rem; }
h1 { font-size: clamp(2rem, 7vw, 4rem); }
</style>
</head>
<body><main><h1>${safe}</h1><p>Replace this paragraph with your introduction.</p></main></body>
</html>
`;
}

declare global {
  interface Window { cloudTerminalDesktop?: { save: (name: string, text: string) => Promise<boolean> } }
}
export async function saveDocument(name: string, text: string): Promise<boolean> {
  if (window.cloudTerminalDesktop) return window.cloudTerminalDesktop.save(name, text);
  const url = URL.createObjectURL(new Blob([text], { type: name.endsWith('.html') ? 'text/html' : 'text/plain' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
