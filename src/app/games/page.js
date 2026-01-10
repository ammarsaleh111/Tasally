import Link from 'next/link';

export default function GamesPage() {
  const games = [
    {
      id: 'wordle',
      name: 'Wordle',
      description: 'Guess the word in 6 tries',
      icon: '📝',
      href: '/games/wordle'
    },
    {
      id: 'connections',
      name: 'Connections',
      description: 'Group words that share a connection',
      icon: '🔗',
      href: '/games/connections'
    },
    {
      id: 'crossword',
      name: 'Mini Crossword',
      description: 'Solve the daily 5×5 crossword puzzle',
      icon: '🔤',
      href: '/games/crossword'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center p-8 animate-fade-in-up">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Ammar Times Games
          </h1>
          <p className="text-xl text-text-muted">
            Daily puzzles to challenge your mind
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game) => (
            <Link
              key={game.id}
              href={game.href}
              className="group bg-card border-2 border-card-border rounded-2xl p-8 hover:bg-surface-hover hover:border-border-active transition-all duration-200 hover:scale-105"
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-5xl">{game.icon}</span>
                <h2 className="text-3xl font-bold text-foreground">
                  {game.name}
                </h2>
              </div>
              <p className="text-text-muted text-lg">
                {game.description}
              </p>
              <div className="mt-4 text-wordle-correct font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                Play Now
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link 
            href="/"
            className="text-text-muted hover:text-foreground transition-colors inline-flex items-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
