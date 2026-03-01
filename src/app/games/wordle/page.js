import WordleGame from '@/games/wordle/Wordle';
import { absoluteUrl } from '@/lib/seo';

export const metadata = {
  title: 'Wordle Game',
  description: 'Play the daily Wordle puzzle and guess the hidden word in six tries.',
  alternates: {
    canonical: '/games/wordle',
  },
  openGraph: {
    title: 'Wordle | Tasally',
    description: 'Play the daily Wordle puzzle and guess the hidden word in six tries.',
    url: absoluteUrl('/games/wordle'),
  },
};

export default function Page() {
  return <WordleGame />;
}
