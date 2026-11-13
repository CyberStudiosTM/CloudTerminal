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
  <dialog id="theme-dialog" aria-labelledby="preview-title">
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
const history = new CommandHistory();
const savedTheme = parsePalette(loadSetting('cloudterminal.theme') ?? '');
let appliedTheme = savedTheme.ok
  ? builtins.find(theme => JSON.stringify(theme) === JSON.stringify(savedTheme.palette)) ?? savedTheme.palette
  : builtins[0];
let customTheme = builtins.includes(appliedTheme) ? undefined : appliedTheme;
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
  themeStatus.textContent = `Theme · ${appliedTheme.name}`;
}

function applyTheme(palette: Palette): void {
  appliedTheme = palette;
  if (!builtins.includes(palette)) customTheme = palette;
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
  listThemes: () => customTheme ? [customTheme, ...builtins.filter(theme => theme.id !== customTheme?.id)] : builtins,
  currentTheme: () => appliedTheme,
  previewTheme,
  applyTheme,
  sky(scene) {
    renderSky(skyContainer, skyArt, scene);
    saveSetting('cloudterminal.sky', scene);
  },
};

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
  runCommand(command, args, context);
  output.scrollTop = output.scrollHeight;
});

input.addEventListener('keydown', event => {
  if (event.isComposing) return;
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    input.value = history.move(event.key === 'ArrowUp' ? -1 : 1, input.value);
  } else if (event.key === 'Tab' && !event.shiftKey && /^\s*\S+$/.test(input.value)) {
    const result = completeCommand(input.value, commands.map(command => command.name));
    // Leave Tab navigation available when completion would make no change.
    if (result.value !== input.value) { event.preventDefault(); input.value = result.value; }
  }
});
input.addEventListener('input', () => history.reset());
