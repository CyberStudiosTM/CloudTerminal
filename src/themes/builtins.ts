import starter from './default.json';
import type { Palette } from './palette';

export const builtins: readonly Palette[] = [
  starter,
  {
    ...starter, id: 'rose-orbit', name: 'Rose Orbit',
    colors: [
      { id: 'ink', name: 'Mulberry ink', hex: '#32223F' },
      { id: 'panel', name: 'Plum', hex: '#432C51' },
      { id: 'text', name: 'Pearl', hex: '#FFF5FA' },
      { id: 'pink', name: 'Rose', hex: '#FFC7E0' },
      { id: 'mint', name: 'Mint', hex: '#B2F6DF' },
    ],
    roles: { background: 'ink', surface: 'panel', foreground: 'text', accent: 'pink', success: 'mint' },
  },
  {
    ...starter, id: 'mint-signal', name: 'Mint Signal',
    colors: [
      { id: 'ink', name: 'Deep lagoon', hex: '#143333' },
      { id: 'panel', name: 'Petrol', hex: '#204242' },
      { id: 'mint', name: 'Spearmint', hex: '#B8F4DB' },
      { id: 'text', name: 'Ice', hex: '#F0FFFB' },
    ],
    roles: { background: 'ink', surface: 'panel', foreground: 'text', accent: 'mint' },
  },
];
