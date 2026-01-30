'use client';

import React, { useEffect, useMemo, useState } from 'react';
import BadgeCard from '@/components/BadgeCard';
import BadgeDetailsSheet from '@/components/BadgeDetailsSheet';
import { getBadgeCategories } from '@/utils/badgesEngine';
import { buildBadgeViewModel, markBadgesSeen, sortBadges } from '@/utils/badgesUtils';
import { getProfile } from '@/utils/profileManager';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'earned', label: 'Earned' },
  { id: 'locked', label: 'Locked' },
  { id: 'category', label: 'By category' },
];

const SORT_OPTIONS = [
  { id: 'closest', label: 'Closest to unlock' },
  { id: 'recent', label: 'Recently earned' },
  { id: 'rarity', label: 'Rarity' },
];

const BadgesCollection = ({ variant = 'page', className = '' }) => {
  const [badges, setBadges] = useState([]);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [category, setCategory] = useState('All');
  const [sortMode, setSortMode] = useState('closest');
  const [selectedBadge, setSelectedBadge] = useState(null);

  useEffect(() => {
    const profile = getProfile();
    queueMicrotask(() => {
      setBadges(buildBadgeViewModel(profile));
    });
    markBadgesSeen();
  }, []);

  const categories = useMemo(() => ['All', ...getBadgeCategories()], []);

  const filteredBadges = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    let result = badges;

    if (filterMode === 'earned') {
      result = result.filter((badge) => badge.earned);
    } else if (filterMode === 'locked') {
      result = result.filter((badge) => !badge.earned);
    } else if (filterMode === 'category' && category !== 'All') {
      result = result.filter((badge) => badge.category === category);
    }

    if (normalizedSearch) {
      result = result.filter(
        (badge) =>
          badge.name.toLowerCase().includes(normalizedSearch) ||
          badge.description.toLowerCase().includes(normalizedSearch)
      );
    }

    return sortBadges(result, sortMode);
  }, [badges, search, filterMode, category, sortMode]);

  const headerClasses =
    variant === 'embedded'
      ? 'text-lg font-semibold text-foreground'
      : 'text-2xl font-bold text-foreground';

  return (
    <div className={`space-y-5 ${className}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className={headerClasses}>Badges</h2>
          <p className="text-sm text-muted-foreground">
            {badges.filter((badge) => badge.earned).length}/{badges.length} earned
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search badges"
              className="w-full sm:w-56 px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--badge-new))]/40"
            />
          </div>

          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--badge-new))]/40"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterMode(tab.id)}
            className={`px-3 py-2 rounded-full text-xs font-semibold transition ${
              filterMode === tab.id
                ? 'bg-[hsl(var(--badge-new))] text-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filterMode === 'category' && (
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                category === item
                  ? 'bg-info/20 text-info'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {filteredBadges.length === 0 && (
        <div className="rounded-2xl border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          No badges match your filters yet.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
        {filteredBadges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} onSelect={setSelectedBadge} />
        ))}
      </div>

      <BadgeDetailsSheet
        badge={selectedBadge}
        isOpen={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
        relatedBadges={badges.filter((b) => b.category === selectedBadge?.category && b.id !== selectedBadge?.id)}
      />
    </div>
  );
};

export default BadgesCollection;
