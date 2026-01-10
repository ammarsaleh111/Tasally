export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-8 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700 via-background to-background"></div>
        
        <div className="z-10 text-center max-w-2xl animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 font-serif tracking-tight">
                Ammar Times
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 mb-12 font-light">
                Your daily dose of mental exercise. 
                <br/>Play games, challenge your mind.
            </p>
            
            <a 
                href="/games" 
                className="
                    inline-block px-8 py-4 
                    bg-white text-slate-900 
                    rounded-full font-bold text-lg 
                    shadow-[0_0_20px_rgba(255,255,255,0.3)] 
                    hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] 
                    hover:scale-105 active:scale-95
                    transition-all duration-300 ease-out
                "
            >
                Enter Games Hub
            </a>
        </div>

        <footer className="absolute bottom-8 text-slate-600 text-sm">
            © 2026 Ammar Times. All rights reserved.
        </footer>
    </div>
  );
}
