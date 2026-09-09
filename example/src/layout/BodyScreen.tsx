import { Diet } from './Diet';
import { Housing } from './Housing';
import { Medical } from './Medical';
import { Overview } from './Overview';
import { Population } from './Population';
import { Taxonomy } from './Taxonomy';

/**
 * Tabs with no data set behind them at all. Kept beside the switch below, so
 * the two cannot disagree about which tabs have something to draw.
 */
const EMPTY_TABS = new Set(['incidents']);

/**
 * Hand this to the header's `empty` and it draws "No data found" in place of
 * the body. It has to be said out loud: a `<BodyScreen />` that renders
 * nothing is still one child, and nothing the header can read tells it what
 * that child will draw.
 */
export const isBodyEmpty = (tab: string) => EMPTY_TABS.has(tab);

export interface BodyScreenProps {
  /** Active tab key. Unknown keys fall through to the overview. */
  tab: string;
  /** Active sub tab key, read only by the screens that show a second bar. */
  subTab: string;
  /** Rows the paging screen should draw. */
  rows: number;
}

/**
 * The body of the parallax header is just `children`, so per-tab content is a
 * switch on the key the caller already holds — no per-tab prop to pass. Keeping
 * that switch here rather than in `App` means adding a tab touches this folder
 * and nothing else.
 */
export const BodyScreen = ({ tab, subTab, rows }: BodyScreenProps) => {
  // The header draws the empty state instead, so there is nothing to return
  // and nothing to fall through to the overview either.
  if (isBodyEmpty(tab)) return null;

  switch (tab) {
    case 'population':
      return <Population rows={rows} />;
    case 'housing':
      return <Housing />;
    case 'medical':
      return <Medical subTab={subTab} />;
    case 'diet':
      return <Diet />;
    case 'taxonomy':
      return <Taxonomy />;
    default:
      return <Overview />;
  }
};
