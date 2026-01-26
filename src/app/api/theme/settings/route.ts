import { NextResponse } from 'next/server';
import { db } from '@/db';
import { themeSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public GET endpoint for theme settings
 * Returns the current active theme configuration
 * No authentication required - used by client to determine active theme
 */
export async function GET() {
  try {
    // Fetch settings (singleton with id = 'main')
    const [settings] = await db
      .select()
      .from(themeSettings)
      .where(eq(themeSettings.id, 'main'))
      .limit(1);

    // If no settings exist, return defaults
    if (!settings) {
      return NextResponse.json({
        activeDominantTheme: null,
        useSchedule: true,
        ramadanStart: null,
        ramadanEnd: null,
        eidStart: null,
        eidEnd: null,
        bannerTitle: null,
        bannerSubtitle: null,
        bannerEnabled: true,
      });
    }

    // Determine the effective active theme
    let effectiveTheme = settings.activeDominantTheme;

    // If using schedule, check date ranges
    if (settings.useSchedule) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // Check Ramadan range
      if (settings.ramadanStart && settings.ramadanEnd) {
        if (today >= settings.ramadanStart && today <= settings.ramadanEnd) {
          effectiveTheme = 'ramadan';
        }
      }

      // Check Eid range (takes precedence if overlapping)
      if (settings.eidStart && settings.eidEnd) {
        if (today >= settings.eidStart && today <= settings.eidEnd) {
          effectiveTheme = 'eid';
        }
      }
    }

    return NextResponse.json({
      activeDominantTheme: effectiveTheme,
      useSchedule: settings.useSchedule,
      ramadanStart: settings.ramadanStart,
      ramadanEnd: settings.ramadanEnd,
      eidStart: settings.eidStart,
      eidEnd: settings.eidEnd,
      bannerTitle: settings.bannerTitle,
      bannerSubtitle: settings.bannerSubtitle,
      bannerEnabled: settings.bannerEnabled,
    });
  } catch (error) {
    console.error('Error fetching theme settings:', error);
    
    // Return defaults on error
    return NextResponse.json({
      activeDominantTheme: null,
      useSchedule: true,
      ramadanStart: null,
      ramadanEnd: null,
      eidStart: null,
      eidEnd: null,
      bannerTitle: null,
      bannerSubtitle: null,
      bannerEnabled: true,
    });
  }
}
