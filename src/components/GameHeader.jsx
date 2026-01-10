import Link from 'next/link';
import React from 'react';

const GameHeader = ({ title }) => {
  return (
    <header className="flex items-center justify-between border-b border-slate-700 pb-2 mb-4 w-full max-w-lg">
      <div className="flex-1">
          {/* Menu placeholder */}
      </div>
      <h1 className="text-3xl font-bold tracking-wider font-serif dark:text-white text-center flex-1">
        {title}
      </h1>
      <div className="flex-1 text-right">
        <Link href="/" className="text-sm dark:text-slate-400 hover:text-white">
          Home
        </Link>
      </div>
    </header>
  );
};

export default GameHeader;
