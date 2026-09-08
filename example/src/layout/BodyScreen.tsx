import { Diet } from './Diet';
import { Housing } from './Housing';
import { Medical } from './Medical';
import { Overview } from './Overview';
import { Population } from './Population';
import { Taxonomy } from './Taxonomy';

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
