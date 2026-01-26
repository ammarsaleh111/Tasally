import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { themeSettings, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateAdminSession } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'admin_session';

/**
 * Admin GET endpoint - returns full settings including audit info
 */
export async function GET(request: NextRequest) {
  // Validate admin session
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const isAdmin = await validateAdminSession(token);
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [settings] = await db
      .select()
      .from(themeSettings)
      .where(eq(themeSettings.id, 'main'))
      .limit(1);

    if (!settings) {
      return NextResponse.json({
        id: 'main',
        activeDominantTheme: null,
        useSchedule: true,
        ramadanStart: null,
        ramadanEnd: null,
        eidStart: null,
        eidEnd: null,
        bannerTitle: null,
        bannerSubtitle: null,
        bannerEnabled: true,
        updatedAt: null,
        updatedByUserId: null,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Admin theme GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch theme settings' },
      { status: 500 }
    );
  }
}

/**
 * Admin PUT endpoint - update theme settings
 */
export async function PUT(request: NextRequest) {
  // Validate admin session
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const isAdmin = await validateAdminSession(token);
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validate input
    const {
      activeDominantTheme,
      useSchedule,
      ramadanStart,
      ramadanEnd,
      eidStart,
      eidEnd,
      bannerTitle,
      bannerSubtitle,
      bannerEnabled,
    } = body;

    // Validate activeDominantTheme
    const validThemes = [null, 'ramadan', 'eid'];
    if (!validThemes.includes(activeDominantTheme)) {
      return NextResponse.json(
        { error: 'Invalid activeDominantTheme. Must be null, "ramadan", or "eid"' },
        { status: 400 }
      );
    }

    // Validate date formats if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (ramadanStart && !dateRegex.test(ramadanStart)) {
      return NextResponse.json({ error: 'Invalid ramadanStart format' }, { status: 400 });
    }
    if (ramadanEnd && !dateRegex.test(ramadanEnd)) {
      return NextResponse.json({ error: 'Invalid ramadanEnd format' }, { status: 400 });
    }
    if (eidStart && !dateRegex.test(eidStart)) {
      return NextResponse.json({ error: 'Invalid eidStart format' }, { status: 400 });
    }
    if (eidEnd && !dateRegex.test(eidEnd)) {
      return NextResponse.json({ error: 'Invalid eidEnd format' }, { status: 400 });
    }

    // Validate string lengths
    if (bannerTitle && bannerTitle.length > 200) {
      return NextResponse.json({ error: 'bannerTitle too long (max 200 chars)' }, { status: 400 });
    }
    if (bannerSubtitle && bannerSubtitle.length > 500) {
      return NextResponse.json({ error: 'bannerSubtitle too long (max 500 chars)' }, { status: 400 });
    }

    // Prepare update data
    const updateData = {
      activeDominantTheme: activeDominantTheme ?? null,
      useSchedule: useSchedule ?? true,
      ramadanStart: ramadanStart ?? null,
      ramadanEnd: ramadanEnd ?? null,
      eidStart: eidStart ?? null,
      eidEnd: eidEnd ?? null,
      bannerTitle: bannerTitle ?? null,
      bannerSubtitle: bannerSubtitle ?? null,
      bannerEnabled: bannerEnabled ?? true,
      updatedAt: new Date(),
    };

    // Upsert settings (create if not exists, update if exists)
    const existing = await db
      .select({ id: themeSettings.id })
      .from(themeSettings)
      .where(eq(themeSettings.id, 'main'))
      .limit(1);

    if (existing.length === 0) {
      // Insert new row
      await db.insert(themeSettings).values({
        id: 'main',
        ...updateData,
      });
    } else {
      // Update existing row
      await db
        .update(themeSettings)
        .set(updateData)
        .where(eq(themeSettings.id, 'main'));
    }

    // Fetch and return updated settings
    const [updated] = await db
      .select()
      .from(themeSettings)
      .where(eq(themeSettings.id, 'main'))
      .limit(1);

    return NextResponse.json({
      success: true,
      settings: updated,
    });
  } catch (error) {
    console.error('Admin theme PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update theme settings' },
      { status: 500 }
    );
  }
}

/**
 * Admin POST endpoint - quick actions (activate/deactivate theme)
 */
export async function POST(request: NextRequest) {
  // Validate admin session
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const isAdmin = await validateAdminSession(token);
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, theme } = body;

    if (action === 'activate') {
      if (!['ramadan', 'eid'].includes(theme)) {
        return NextResponse.json(
          { error: 'Invalid theme. Must be "ramadan" or "eid"' },
          { status: 400 }
        );
      }

      // Upsert with manual activation
      const existing = await db
        .select({ id: themeSettings.id })
        .from(themeSettings)
        .where(eq(themeSettings.id, 'main'))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(themeSettings).values({
          id: 'main',
          activeDominantTheme: theme,
          useSchedule: false, // Manual override
          updatedAt: new Date(),
        });
      } else {
        await db
          .update(themeSettings)
          .set({
            activeDominantTheme: theme,
            useSchedule: false,
            updatedAt: new Date(),
          })
          .where(eq(themeSettings.id, 'main'));
      }

      return NextResponse.json({
        success: true,
        message: `${theme} theme activated`,
      });
    }

    if (action === 'deactivate') {
      await db
        .update(themeSettings)
        .set({
          activeDominantTheme: null,
          updatedAt: new Date(),
        })
        .where(eq(themeSettings.id, 'main'));

      return NextResponse.json({
        success: true,
        message: 'Theme deactivated',
      });
    }

    if (action === 'enable-schedule') {
      await db
        .update(themeSettings)
        .set({
          useSchedule: true,
          updatedAt: new Date(),
        })
        .where(eq(themeSettings.id, 'main'));

      return NextResponse.json({
        success: true,
        message: 'Schedule mode enabled',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin theme POST error:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}
