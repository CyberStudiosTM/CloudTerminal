export const scenes = ['clouds', 'stars', 'off'] as const;
export type Scene = typeof scenes[number];

export const skyArt: Record<Exclude<Scene, 'off'>, string> = {
  clouds: [
    '       .          ✦               ·          ',
    '                    .----.                   ',
    '          .--.   .-(      ).                 ',
    '       .-(    )-(           )-.      .--.    ',
    '      (________________________)  .-(    )-. ',
    '          ·                      (__________) ',
  ].join('\n'),
  stars: [
    '      .         ✦                    .       ',
    '                            ·                ',
    '            .          .             ✧       ',
    '     ✧             ·                         ',
    '                             ✦               ',
    '                .                     ·      ',
  ].join('\n'),
};

export function isScene(value: string | undefined | null): value is Scene {
  return scenes.some(scene => scene === value);
}
