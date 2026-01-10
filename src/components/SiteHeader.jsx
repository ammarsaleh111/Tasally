// src/components/SiteHeader.jsx
import Link from 'next/link';

export default function SiteHeader() {
  return (
    <nav className="w-full flex items-center justify-between p-4 border-b border-slate-800 bg-background/80 backdrop-blur sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {/* Menu Icon Placeholder */}
        <button className="text-slate-300 hover:text-white p-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        </button>

        <Link href="/" className="text-2xl font-serif font-bold tracking-tight hover:opacity-80 transition-opacity">
            Ammar Times
        </Link>
      </div>

      <div className="flex gap-4">
        <Link 
            href="/games" 
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
        >
            All Games
        </Link>
        {/* User / Settings placeholders */}
      </div>
    </nav>
  );
}
