import WordleGame from '@/games/wordle/Wordle';

export const metadata = {
  title: 'Wordle - Ammar Times',
  description: 'Daily Word Puzzle Game',
};

export default function Page() {
  return <WordleGame />;
}
