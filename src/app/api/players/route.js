import { NextResponse } from 'next/server';
import { getAllPlayers, savePlayers } from '@/lib/serverData';

export async function GET() {
  const players = await getAllPlayers();
  return NextResponse.json({ players });
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { userId, name, createdAt, updatedAt, games } = payload || {};

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const players = await getAllPlayers();
    const existingIndex = players.findIndex(player => player.userId === userId);

    const playerRecord = {
      userId,
      name: name || 'Anonymous',
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: updatedAt || new Date().toISOString(),
      games: games || {},
    };

    if (existingIndex >= 0) {
      players[existingIndex] = {
        ...players[existingIndex],
        ...playerRecord,
      };
    } else {
      players.push(playerRecord);
    }

    await savePlayers(players);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API /players] Error', error);
    return NextResponse.json({ error: 'Failed to save player' }, { status: 500 });
  }
}
