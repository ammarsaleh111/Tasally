// src/components/GameCard.jsx
import Link from 'next/link';

export default function GameCard({ title, description, color, link, icon }) {
  return (
    <Link href={link} className="group block">
      <div 
        className="
            relative overflow-hidden rounded-xl border border-card-border bg-card
            p-6 h-full transition-all duration-300
            hover:border-border-active hover:shadow-xl hover:-translate-y-1
        "
      >
        <div 
            className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity transform group-hover:scale-110 duration-500"
            style={{ color: color }}
        >
            {/* Simple icon placeholder based on prop or default */}
            {icon || (
                <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="2" y="2" width="20" height="20" rx="4" />
                </svg>
            )}
        </div>

        <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
                <h3 className="text-2xl font-bold mb-2 text-foreground transition-colors">
                    {title}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                    {description}
                </p>
            </div>
            
            <div className="mt-4 flex items-center text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-text-muted group-hover:text-foreground">
                Play Now <span className="ml-1">→</span>
            </div>
        </div>
      </div>
    </Link>
  );
}
