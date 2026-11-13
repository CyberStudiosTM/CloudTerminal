import { expect, it } from 'vitest';
import { CommandHistory, completeCommand, parseCommand } from '../../src/terminal/input';

it('parses commands without treating punctuation as executable syntax', () => {
  expect(parseCommand('  ThEmE  preview rose-orbit ')).toEqual({ command: 'theme', args: ['preview', 'rose-orbit'] });
  expect(parseCommand('<script>alert(1)</script>').command).toBe('<script>alert(1)</script>');
});

it('navigates history and restores the draft', () => {
  const history = new CommandHistory();
  history.record('help');
  history.record('sky stars');
  history.record('sky stars');
  expect(history.move(-1, 'about')).toBe('sky stars');
  expect(history.move(-1, '')).toBe('help');
  expect(history.move(1, '')).toBe('sky stars');
  expect(history.move(1, '')).toBe('about');
});

it('completes unique commands and reports ambiguous matches', () => {
  expect(completeCommand('th', ['theme', 'help']).value).toBe('theme ');
  expect(completeCommand('t', ['theme', 'themes'])).toEqual({ value: 'theme', matches: ['theme', 'themes'] });
  expect(completeCommand('xyz', ['theme']).value).toBe('xyz');
});
