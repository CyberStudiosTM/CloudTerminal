import { isScene, scenes, type Scene } from '../animations/sky';
import { studio } from '../settings';
import type { Palette } from '../themes/palette';

export interface CommandContext {
  write: (message: string, tone?: 'error' | 'success') => void;
  writeLink: (name: string, href: string) => void;
  clear: () => void;
  importFile: () => void;
  listThemes: () => readonly Palette[];
  currentTheme: () => Palette;
  previewTheme: (palette: Palette) => void;
  applyTheme: (palette: Palette) => void;
  sky: (scene: Scene) => void;
}

interface Command {
  name: string;
  usage: string;
  description: string;
  run: (args: string[], context: CommandContext) => void;
}

export const commands: readonly Command[] = [
  { name: 'help', usage: 'help', description: 'List commands.',
    run: (_, { write }) => write(commands.map(item => `${item.usage}\n  ${item.description}`).join('\n')) },
  { name: 'about', usage: 'about', description: 'Meet CloudTerminal.',
    run: (_, { write }) => write(`CloudTerminal is a simulated browser terminal by ${studio.name}.`) },
  { name: 'projects', usage: 'projects', description: 'Open CyberStudios links.',
    run: (_, { writeLink }) => studio.projects.forEach(project => writeLink(project.name, project.url)) },
  { name: 'theme', usage: 'theme [list | preview <id> | apply <id>]', description: 'Browse and switch terminal themes.',
    run: ([action = 'list', ...parts], context) => {
      const id = parts.join(' ');
      if (action === 'list' && !id) {
        context.write(context.listThemes().map(theme =>
          `${theme.id}  ·  ${theme.name}${theme === context.currentTheme() ? ' [active]' : ''}`).join('\n'));
        return;
      }
      if ((action !== 'preview' && action !== 'apply') || !id) {
        context.write('Usage: theme [list | preview <id> | apply <id>]', 'error');
        return;
      }
      const palette = context.listThemes().find(theme => theme.id === id);
      if (!palette) { context.write('Unknown theme. Run theme list for available IDs.', 'error'); return; }
      if (action === 'preview') context.previewTheme(palette);
      else context.applyTheme(palette);
    } },
  { name: 'import', usage: 'import', description: 'Preview a CyberStudios JSON palette.',
    run: (_, { importFile }) => importFile() },
  { name: 'sky', usage: 'sky [clouds | stars | off]', description: 'Change the ASCII sky.',
    run: ([scene, ...extra], { write, sky }) => {
      if (!isScene(scene) || extra.length) { write(`Usage: sky [${scenes.join(' | ')}]`); return; }
      sky(scene);
      write(`Sky set to ${scene}.`);
    } },
  { name: 'byte', usage: 'byte', description: 'Say hello to Byte.',
    run: (_, { write }) => write(' /\\_/\\\n( o.o )  Byte purrs.\n > ^ <', 'success') },
  { name: 'clear', usage: 'clear', description: 'Clear the terminal output.',
    run: (_, { clear }) => clear() },
];

export function runCommand(command: string, args: string[], context: CommandContext): void {
  const match = commands.find(item => item.name === command);
  if (match) match.run(args, context);
  else context.write(`Unknown command “${command}”. Type help for available commands.`, 'error');
}
