'use client';

import React from 'react';
import SiteHeader from '@/components/SiteHeader';
import BadgesCollection from '@/components/BadgesCollection';
import BadgesProgressWidget from '@/components/BadgesProgressWidget';
import { SeasonPageHeader, SeasonDivider } from '@/components/SeasonIdentity';

export default function BadgesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <SeasonPageHeader
            title="Badges"
            subtitle="Track your progress and unlock new badges across every game."
            showBadge={true}
          />
        </div>

        <SeasonDivider variant="gradient" className="my-8" />

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <BadgesCollection />
          <div className="space-y-4">
            <BadgesProgressWidget />
            <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Open any badge to see detailed requirements. New badges stay marked until you visit this screen or
              view details.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
