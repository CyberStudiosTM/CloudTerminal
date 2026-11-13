export const studio = {
  name: 'CyberStudios™',
  projects: [
    { name: 'CyberStudios', url: 'https://github.com/CyberStudiosTM' },
    { name: 'GhostPort', url: 'https://github.com/CyberStudiosTM/GhostPort' },
    { name: 'ModManifest', url: 'https://github.com/CyberStudiosTM/ModManifest' },
  ],
};

export function loadSetting(key: string): string | null {
  try { return localStorage.getItem(key); }
  catch { return null; }
}

export function saveSetting(key: string, value: string): boolean {
  try { localStorage.setItem(key, value); return true; }
  catch { return false; }
}
