export function parseCommand(input: string): { command: string; args: string[] } {
  const [command = '', ...args] = input.trim().split(/\s+/);
  return { command: command.toLowerCase(), args };
}

export class CommandHistory {
  private entries: string[] = [];
  private cursor = 0;
  private draft = '';

  record(command: string): void {
    if (command !== this.entries.at(-1)) this.entries.push(command);
    if (this.entries.length > 100) this.entries.shift();
    this.reset();
  }

  reset(): void {
    this.cursor = this.entries.length;
    this.draft = '';
  }

  move(direction: -1 | 1, current: string): string {
    if (direction === -1 && this.cursor === this.entries.length) this.draft = current;
    this.cursor = Math.max(0, Math.min(this.entries.length, this.cursor + direction));
    return this.entries[this.cursor] ?? this.draft;
  }
}

export function completeCommand(input: string, choices: readonly string[]) {
  const matches = choices.filter(choice => choice.startsWith(input.trimStart().toLowerCase()));
  if (matches.length <= 1) return { matches, value: matches[0] ? matches[0] + ' ' : input };
  let prefix = matches[0];
  while (!matches.every(match => match.startsWith(prefix))) prefix = prefix.slice(0, -1);
  return { matches, value: prefix };
}
