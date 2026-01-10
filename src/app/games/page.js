// src/app/games/page.js
import SiteHeader from '@/components/SiteHeader';
import GameCard from '@/components/GameCard';

const GAMES = [
  {
    id: 'wordle',
    title: 'Wordle',
    description: 'Get 6 chances to guess a 5-letter word.',
    color: '#538d4e', // Green
    link: '/games/wordle',
    icon: (
        <svg  width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" opacity="0.4"/>
            <path d="M7 7h2v2H7V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7z"/> 
        </svg>
    )
  },
  // Future games will be added here
  {
    id: 'connections',
    title: 'Connections',
    description: 'Group words that share a common thread. (Coming Soon)',
    color: '#b59f3b', // Yellow
    link: '#', // Disabled for now
    icon: (
        <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
             <rect x="4" y="4" width="7" height="7" rx="1" />
             <rect x="13" y="4" width="7" height="7" rx="1" />
             <rect x="4" y="13" width="7" height="7" rx="1" />
             <rect x="13" y="13" width="7" height="7" rx="1" />
        </svg>
    )
  }
];

export default function GamesHub() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      
      <main className="flex-grow p-8 max-w-6xl mx-auto w-full">
        <h1 className="text-4xl font-bold mb-2">All Games</h1>
        <p className="text-slate-400 mb-8">Choose a game to start playing.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {GAMES.map(game => (
                <GameCard key={game.id} {...game} />
            ))}
        </div>
      </main>
    </div>
  );
}
