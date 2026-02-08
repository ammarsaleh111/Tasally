import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/dictionary?word=...&pos=noun|verb|adjective
 *
 * Fetches definition for a specific part of speech from the
 * Free Dictionary API (primary) and Wordnik (fallback).
 *
 * In-memory cache with 30-min TTL to reduce API calls.
 */

const VALID_POS = ["noun", "verb", "adjective"] as const;
type POS = (typeof VALID_POS)[number];

// In-memory cache: "WORD:pos" -> { definition, timestamp }
const posCache = new Map<string, { data: POSResult; ts: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface POSResult {
  word: string;
  pos: POS;
  definition: string | null;
  example: string | null;
  found: boolean;
  source: string;
}

// ─── Free Dictionary API ───────────────────────────────────────────────────

async function fetchFromFreeDictionary(
  word: string,
  pos: POS
): Promise<POSResult | null> {
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
      word.toLowerCase()
    )}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    // Search all entries for the requested POS
    for (const entry of data) {
      if (!entry.meanings) continue;
      for (const meaning of entry.meanings) {
        if (
          meaning.partOfSpeech?.toLowerCase() === pos &&
          meaning.definitions?.length > 0
        ) {
          return {
            word: word.toUpperCase(),
            pos,
            definition: meaning.definitions[0].definition,
            example: meaning.definitions[0].example ?? null,
            found: true,
            source: "free-dictionary-api",
          };
        }
      }
    }

    return null; // POS not found
  } catch {
    return null;
  }
}

// ─── Wordnik API (fallback) ────────────────────────────────────────────────

const WORDNIK_API_KEY = process.env.WORDNIK_API_KEY || "";
const WORDNIK_BASE = "https://api.wordnik.com/v4/word.json";

async function fetchFromWordnik(
  word: string,
  pos: POS
): Promise<POSResult | null> {
  if (!WORDNIK_API_KEY) return null;

  try {
    const url = `${WORDNIK_BASE}/${encodeURIComponent(
      word.toLowerCase()
    )}/definitions?limit=10&includeRelated=false&sourceDictionaries=all&useCanonical=false&includeTags=false&api_key=${WORDNIK_API_KEY}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data)) return null;

    for (const entry of data) {
      if (entry.partOfSpeech?.toLowerCase() === pos && entry.text) {
        return {
          word: word.toUpperCase(),
          pos,
          definition: entry.text,
          example: null,
          found: true,
          source: "wordnik",
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Route Handler ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const word = searchParams.get("word");
    const pos = searchParams.get("pos") as POS | null;

    if (!word || typeof word !== "string" || word.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or empty 'word' parameter" },
        { status: 400 }
      );
    }

    if (!pos || !VALID_POS.includes(pos)) {
      return NextResponse.json(
        { error: `Invalid 'pos' parameter. Must be one of: ${VALID_POS.join(", ")}` },
        { status: 400 }
      );
    }

    const normalized = word.toUpperCase().trim();
    const cacheKey = `${normalized}:${pos}`;

    // Check in-memory cache
    const cached = posCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        headers: { "X-Cache": "HIT" },
      });
    }

    // Try Free Dictionary API first
    let result = await fetchFromFreeDictionary(normalized, pos);

    // Fallback to Wordnik
    if (!result) {
      result = await fetchFromWordnik(normalized, pos);
    }

    // No definition found for this POS
    if (!result) {
      result = {
        word: normalized,
        pos,
        definition: null,
        example: null,
        found: false,
        source: "none",
      };
    }

    // Cache the result (including negative results)
    posCache.set(cacheKey, { data: result, ts: Date.now() });

    // Evict stale entries periodically
    if (posCache.size > 500) {
      const now = Date.now();
      for (const [k, v] of posCache) {
        if (now - v.ts > CACHE_TTL_MS * 2) {
          posCache.delete(k);
        }
      }
    }

    return NextResponse.json(result, {
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("[dictionary] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
