import { saveDocument, starterSite } from './site';
import './style.css';
import { isScene } from './animations/sky';
import { commands, runCommand, type CommandContext } from './commands/registry';
import { loadSetting, saveSetting } from './settings';
import { completeCommand, CommandHistory, parseCommand } from './terminal/input';
import { renderSky, setThemeColors } from './terminal/view';
import { builtins } from './themes/builtins';
import { maxPaletteBytes, parsePalette, type Palette } from './themes/palette';

document.body.innerHTML = `
  <div class="workspace">
    <header class="site-header"><a href="https://github.com/CyberStudiosTM" class="studio"><span aria-hidden="true">✦</span> CYBERSTUDIOS™</a><span class="site-label">BROWSER TERMINAL</span></header>
    <main>
      <div class="hero">
        <div><h1>Cloud<span>Terminal</span></h1><p>A little terminal above the clouds.</p></div>
        <button id="import-button" class="import" type="button"><span aria-hidden="true">↥</span> Import palette</button>
        <input id="palette-file" type="file" accept=".json,application/json" hidden>
      </div>
      <div class="desktop-controls" aria-label="Desktop controls">
  <button type="button" id="new-session">New session</button>
  <div id="sessions" role="group" aria-label="Sessions"></div>
  <label>Theme <select id="quick-theme" aria-label="Quick theme"></select></label>
  <button type="button" id="favorite">Favorite theme</button>
  <button type="button" id="theme-card">Theme gallery</button><button type="button" id="tour">Take the tour</button><label>Font size <input id="font-size" type="number" min="12" max="24" value="14"></label><label>Profile name <input id="profile-name" maxlength="80" size="12"></label><button type="button" id="save-profile">Save profile</button><select id="profiles" aria-label="Workspace profiles"><option value="">Open profile</option></select>
</div>
<section class="terminal" aria-label="Simulated terminal">
        <header class="titlebar">
          <div class="window-dots" aria-hidden="true"><i></i><i></i><i></i></div>
          <span>cloud@cyberspace</span>
          <label class="motion"><input id="reduce-motion" type="checkbox"> Reduce motion</label>
        </header>
        <div id="sky" aria-hidden="true" class="sky"><pre id="sky-art"></pre></div>
        <div id="output" class="output" role="log" aria-label="Terminal output" aria-live="polite" tabindex="0"></div>
        <form id="command-form" class="command-form">
          <label for="command" aria-label="Command">~ <span aria-hidden="true">❯</span></label>
          <input id="command" type="text" maxlength="500" placeholder="Type a command…" autocomplete="off" spellcheck="false" autocapitalize="off" aria-describedby="keyboard-hints">
          <button type="submit">Run <span aria-hidden="true">↵</span></button>
        </form>
      </section>
      <footer class="status-bar">
        <span id="theme-status"></span>
        <span id="keyboard-hints"><kbd>↑</kbd> <kbd>↓</kbd> History <kbd>Tab</kbd> Complete <kbd>Enter</kbd> Run</span>
      </footer>
    </main>
  </div>
  <dialog id="gallery" aria-label="Theme gallery"><h2>Theme gallery</h2><div id="theme-tiles"></div><button id="close-gallery">Close</button></dialog><dialog id="theme-dialog" aria-labelledby="preview-title">
    <h2 id="preview-title">Preview theme</h2>
    <p id="preview-name"></p>
    <div id="theme-preview" class="theme-preview"><code>~ <strong>❯</strong> help</code><br>Welcome to CloudTerminal.</div>
    <div class="dialog-buttons">
      <button id="cancel-theme" type="button" autofocus>Cancel</button>
      <button id="apply-theme" type="button">Apply theme</button>
    </div>
  </dialog>`;

const query = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const terminal = query('.terminal');
const output = query('#output');
const input = query<HTMLInputElement>('#command');
const fileInput = query<HTMLInputElement>('#palette-file');
const motionSwitch = query<HTMLInputElement>('#reduce-motion');
const dialog = query<HTMLDialogElement>('#theme-dialog');
const skyContainer = query('#sky');
const skyArt = query('#sky-art');
const themeStatus = query('#theme-status');
let history = new CommandHistory();
const savedTheme = parsePalette(loadSetting('cloudterminal.theme') ?? '');
let appliedTheme = savedTheme.ok
  ? builtins.find(theme => JSON.stringify(theme) === JSON.stringify(savedTheme.palette)) ?? savedTheme.palette
  : builtins[0];
const customThemes = new Map<string, Palette>();
try {
  const stored: unknown = JSON.parse(loadSetting('cloudterminal.library') ?? '[]');
  if (Array.isArray(stored)) for (const record of stored) {
    const result = parsePalette(JSON.stringify(record));
    if (result.ok) customThemes.set(result.palette.id, result.palette);
  }
} catch { /* Start with the active theme when the library is unreadable. */ }
if (!builtins.includes(appliedTheme)) customThemes.set(appliedTheme.id, appliedTheme);
let pendingTheme: Palette | undefined;

function append(line: HTMLElement): void {
  const follow = output.scrollHeight - output.scrollTop - output.clientHeight < 32;
  output.append(line);
  if (follow) output.scrollTop = output.scrollHeight;
}

function write(message: string, tone?: string): void {
  const line = document.createElement('p');
  if (tone) line.className = tone;
  line.textContent = message;
  append(line);
}

function showActiveTheme(): void {
  setThemeColors(terminal, appliedTheme);
  refreshThemes();
  themeStatus.textContent = `Theme · ${appliedTheme.name}`;
}

function applyTheme(palette: Palette): void {
  appliedTheme = palette;
  advanceTour(0);
  if (!builtins.includes(palette)) {
    customThemes.set(palette.id, palette);
    saveSetting('cloudterminal.library', JSON.stringify([...customThemes.values()]));
  }
  showActiveTheme();
  const saved = saveSetting('cloudterminal.theme', JSON.stringify(palette));
  write(saved ? `Applied ${palette.name}.` : `Applied ${palette.name} for this session. Browser storage is unavailable.`, 'success');
}

function previewTheme(palette: Palette): void {
  pendingTheme = palette;
  query('#preview-name').textContent = palette.name;
  setThemeColors(query('#theme-preview'), palette);
  if (!dialog.open) dialog.showModal();
}

const context: CommandContext = {
  write,
  writeLink(name, href) {
    const line = document.createElement('p');
    const link = document.createElement('a');
    link.href = href;
    link.textContent = name;
    line.append(link);
    append(line);
  },
  clear: () => output.replaceChildren(),
  importFile: () => fileInput.click(),
  listThemes: () => [...customThemes.values(), ...builtins.filter(theme => !customThemes.has(theme.id))],
  currentTheme: () => appliedTheme,
  previewTheme,
  applyTheme,
  sky(scene) {
    renderSky(skyContainer, skyArt, scene);
    saveSetting('cloudterminal.sky', scene);
  },
};

const sessions = [{ history, lines: document.createDocumentFragment(), draft: '' }];
const sessionPicker = query('#sessions');
let activeSession = 0;
function renderSessions() {
  sessionPicker.replaceChildren(...sessions.map((_, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Session ' + (index + 1);
    button.setAttribute('aria-pressed', String(index === activeSession));
    button.addEventListener('click', () => selectSession(index));
    return button;
  }));
}
renderSessions();
function selectSession(index: number) {
  const previous = sessions[activeSession];
  previous.lines.append(...output.childNodes);
  previous.draft = input.value;
  activeSession = index;
  const current = sessions[index];
  output.append(current.lines);
  history = current.history;
  input.value = current.draft;
  renderSessions();
  input.focus();
}

query('#new-session').addEventListener('click', () => {
  const index = sessions.length;
  sessions.push({ history: new CommandHistory(), lines: document.createDocumentFragment(), draft: '' });

  selectSession(index);
  write('New session. Type help to see the commands.');
});
const quickTheme = query<HTMLSelectElement>('#quick-theme');
const favoriteButton = query<HTMLButtonElement>('#favorite');
const favorites = new Set((loadSetting('cloudterminal.favorites') ?? '').split('\n').filter(Boolean));
function refreshThemes() {
  quickTheme.replaceChildren(...[...context.listThemes()].sort((a, b) =>
    Number(favorites.has(b.id)) - Number(favorites.has(a.id))
  ).map(palette => new Option((favorites.has(palette.id) ? '★ ' : '') + palette.name, palette.id)));
  quickTheme.value = appliedTheme.id;
  favoriteButton.setAttribute('aria-pressed', String(favorites.has(appliedTheme.id)));
  const card = query('#theme-card');
  setThemeColors(card, appliedTheme);
  card.style.background = 'var(--theme-surface)';
  card.style.color = 'var(--theme-foreground)';
  card.style.borderColor = 'var(--theme-accent)';
}
quickTheme.addEventListener('change', () => {
  const theme = context.listThemes().find(item => item.id === quickTheme.value);
  if (theme) applyTheme(theme);
});
favoriteButton.addEventListener('click', () => {
  if (favorites.has(appliedTheme.id)) favorites.delete(appliedTheme.id);
  else favorites.add(appliedTheme.id);
  saveSetting('cloudterminal.favorites', [...favorites].join('\n'));
  refreshThemes();
});
const mediaMotion = matchMedia('(prefers-reduced-motion: reduce)');
motionSwitch.checked = loadSetting('cloudterminal.reduceMotion') === 'true';
function refreshMotion(): void {
  terminal.classList.toggle('reduce-motion', motionSwitch.checked || mediaMotion.matches);
}
motionSwitch.addEventListener('change', () => {
  refreshMotion();
  saveSetting('cloudterminal.reduceMotion', String(motionSwitch.checked));
});
mediaMotion.addEventListener('change', refreshMotion);
refreshMotion();
const gallery = query<HTMLDialogElement>('#gallery');
function renderGallery() {
  const tiles = query('#theme-tiles');
  tiles.replaceChildren();
  for (const theme of [...context.listThemes()].sort((a, b) => Number(favorites.has(b.id)) - Number(favorites.has(a.id)))) {
    const tile = document.createElement('section');
    setThemeColors(tile, theme);
    const preview = document.createElement('button');
    preview.type = 'button';
    preview.className = 'theme-tile';
    preview.textContent = (favorites.has(theme.id) ? '★ ' : '') + theme.name + '\n❯ help';
    preview.addEventListener('click', () => { gallery.close(); previewTheme(theme); });
    tile.append(preview);
    if (customThemes.has(theme.id)) {
      const name = document.createElement('input');
      name.value = theme.name;
      name.maxLength = 120;
      name.setAttribute('aria-label', 'Rename ' + theme.name);
      const rename = document.createElement('button');
      rename.textContent = 'Rename';
      rename.addEventListener('click', () => {
        if (!name.value.trim()) return;
        const updated = { ...theme, name: name.value.trim() };
        customThemes.set(theme.id, updated);
        if (appliedTheme === theme) applyTheme(updated);
        persistGallery();
      });
      const remove = document.createElement('button');
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', 'Remove ' + theme.name);
      remove.addEventListener('click', () => {
        customThemes.delete(theme.id);
        favorites.delete(theme.id);
        saveSetting('cloudterminal.favorites', [...favorites].join('\n'));
        if (appliedTheme.id === theme.id) applyTheme(builtins[0]);
        persistGallery();
      });
      tile.append(name, rename, remove);
    }
    tiles.append(tile);
  }
}
function persistGallery() {
  if (!saveSetting('cloudterminal.library', JSON.stringify([...customThemes.values()]))) write('Could not save the theme library.', 'error');
  refreshThemes();
  renderGallery();
}
query('#theme-card').addEventListener('click', () => { renderGallery(); gallery.showModal(); });
query('#close-gallery').addEventListener('click', () => gallery.close());
const steps = ['Choose or apply a theme.', 'Run cat welcome.txt.', 'Run byte pet.', 'Run site My Website and save the file.'];
let tourStep = -1;
function advanceTour(step: number) {
  if (tourStep !== step) return;
  tourStep++;
  write(steps[tourStep] ?? 'Tour complete.', 'success');
  if (tourStep === steps.length) tourStep = -1;
}
query('#tour').addEventListener('click', () => {
  tourStep = 0;
  write(steps[0], 'success');
  output.scrollTop = output.scrollHeight;
});
const fontSize = query<HTMLInputElement>('#font-size');
function updateFont(value: number) {
  const size = Number.isFinite(value) ? Math.max(12, Math.min(24, value)) : 14;
  fontSize.value = String(size);
  output.style.fontSize = size + 'px';
  saveSetting('cloudterminal.fontSize', String(size));
}
updateFont(Number(loadSetting('cloudterminal.fontSize') ?? 14));
fontSize.addEventListener('change', () => updateFont(fontSize.valueAsNumber));

interface Profile { name: string; theme: Palette; sky: string; motion: boolean; font: number }
let profiles: Profile[] = [];
try {
  const stored: unknown = JSON.parse(loadSetting('cloudterminal.profiles') ?? '[]');
  if (Array.isArray(stored)) profiles = stored.flatMap(item => {
    const result = parsePalette(JSON.stringify(item?.theme));
    return result.ok && typeof item.name === 'string' && isScene(item.sky) &&
      typeof item.motion === 'boolean' && typeof item.font === 'number'
      ? [{ ...item, theme: result.palette }] : [];
  });
} catch { /* Ignore malformed profile storage. */ }
const profilePicker = query<HTMLSelectElement>('#profiles');
function renderProfiles() {
  profilePicker.replaceChildren(new Option('Open profile', ''),
    ...profiles.map((profile, index) => new Option(profile.name, String(index))));
}
renderProfiles();
query('#save-profile').addEventListener('click', () => {
  const name = query<HTMLInputElement>('#profile-name').value.trim().slice(0, 80);
  if (!name) return;
  const next = [...profiles.filter(profile => profile.name !== name), {
    name, theme: appliedTheme, sky: loadSetting('cloudterminal.sky') ?? 'clouds',
    motion: motionSwitch.checked, font: fontSize.valueAsNumber,
  }];
  if (!saveSetting('cloudterminal.profiles', JSON.stringify(next))) {
    write('Could not save the workspace profile.', 'error');
    return;
  }
  profiles = next;
  renderProfiles();
  write('Saved workspace ' + name + '.', 'success');
});
profilePicker.addEventListener('change', () => {
  if (!profilePicker.value) return;
  const profile = profiles[Number(profilePicker.value)];
  applyTheme(profile.theme);
  if (isScene(profile.sky)) context.sky(profile.sky);
  motionSwitch.checked = profile.motion;
  motionSwitch.dispatchEvent(new Event('change'));
  updateFont(profile.font);
  profilePicker.value = '';
});

const savedScene = loadSetting('cloudterminal.sky');
renderSky(skyContainer, skyArt, isScene(savedScene) ? savedScene : 'clouds');
showActiveTheme();
write('Welcome to CloudTerminal.', 'success');
write('Type help to see what you can do.');

query('#import-button').addEventListener('click', context.importFile);
let importRequest = 0;
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  const request = ++importRequest;
  fileInput.value = '';
  try {
    if (file.size > maxPaletteBytes) throw new Error('Use a JSON palette smaller than 256 KiB.');
    const result = parsePalette(await file.text());
    if (request !== importRequest) return;
    if (!result.ok) throw new Error(result.error);
    previewTheme(result.palette);
  } catch (error) {
    if (request !== importRequest) return;
    write(error instanceof Error ? error.message : 'The palette could not be read.', 'error');
    output.scrollTop = output.scrollHeight;
    output.focus();
  }
});

query('#cancel-theme').addEventListener('click', () => dialog.close());
query('#apply-theme').addEventListener('click', () => {
  if (pendingTheme) applyTheme(pendingTheme);
  dialog.close();
});
dialog.addEventListener('close', () => { pendingTheme = undefined; });

query('#command-form').addEventListener('submit', event => {
  event.preventDefault();
  const line = input.value.trim();
  if (!line) return;
  history.record(line);
  input.value = '';
  input.focus();
  const { command, args } = parseCommand(line);
  output.scrollTop = output.scrollHeight;
  write(`❯ ${line}`);
  if (command === 'site' || command === 'transcript') {
    const title = args.join(' ') || 'My CyberStudios site';
    const name = command === 'site' ? 'index.html' : 'transcript.txt';
    const content = command === 'site' ? starterSite(title, appliedTheme) : output.innerText;
    void saveDocument(name, content).then(saved => {
      if (saved) { write('Exported ' + name + '.', 'success'); if (command === 'site') advanceTour(3); }
    }).catch(() => write('Could not save ' + name + '.', 'error'));
  } else if (command === 'history') {
    write(history.search(args.join(' ')).join('\n') || 'No matching commands.');
  } else if (command === 'ls') {
    write('welcome.txt  byte.txt');
  } else if (command === 'cat') {
    if (args[0] === 'welcome.txt') { write('Try theme list, sky stars, byte, then site My Website.'); advanceTour(1); }
    else if (args[0] === 'byte.txt') write('Byte likes cloud watching. Try byte pet.');
    else write('File not found. Type ls to see the virtual files.', 'error');
  } else if (command === 'byte' && args[0] === 'pet') {
    write('Byte purrs and rolls over.', 'success'); advanceTour(2);
  } else runCommand(command, args, context);
  output.scrollTop = output.scrollHeight;
});

input.addEventListener('keydown', event => {
  if (event.isComposing) return;
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    input.value = history.move(event.key === 'ArrowUp' ? -1 : 1, input.value);
  } else if (event.key === 'Tab' && !event.shiftKey && input.value.trim()) {
    const argumentChoices = [
      'sky clouds', 'sky stars', 'sky off', 'theme list', 'cat welcome.txt', 'cat byte.txt', 'byte pet',
      ...context.listThemes().flatMap(theme => ['theme preview ' + theme.id, 'theme apply ' + theme.id]),
    ];
    if (input.value.includes(' ')) {
      const result = completeCommand(input.value, argumentChoices);
      if (result.value !== input.value && result.matches.length) {
        event.preventDefault();
        input.value = result.value;
      }
      return;
    }
    const result = completeCommand(input.value, [...commands.map(command => command.name), 'site', 'transcript', 'history', 'ls', 'cat']);
    // Leave Tab navigation available when completion would make no change.
    if (result.value !== input.value) { event.preventDefault(); input.value = result.value; }
  }
});
input.addEventListener('input', () => history.reset());
