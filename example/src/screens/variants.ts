/** The three header screens, as the launcher names them. */
export type HeroVariant = 'image' | 'fitted' | 'plain';

export const CHOICES: {
  variant: HeroVariant;
  title: string;
  detail: string;
}[] = [
  {
    variant: 'image',
    title: 'With an image',
    detail:
      'A 450pt hero carousel under `absoluteFill`. `headerHeight` is the floor and `autoHeight` grows past it when the content is taller.',
  },
  {
    variant: 'fitted',
    title: 'With an image, fitted',
    detail:
      'No `headerHeight`. The carousel is in flow with an `aspectRatio`, so the picture decides the height and none of it is cropped.',
  },
  {
    variant: 'plain',
    title: 'Without an image',
    detail:
      'No `headerHeight` and nothing to fill it: `autoHeight` measures the copy, so the tag row lengthens the header and every offset follows.',
  },
];
