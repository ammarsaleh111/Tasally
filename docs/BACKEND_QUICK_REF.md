# ⚡ Backend Quick Reference

## Environment Variables

### Required

```bash
DATABASE_URL=postgres://user:pass@host.neon.tech:5432/db?sslmode=require
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
```

### Optional

```bash
WORDNIK_API_KEY=xxx
ADMIN_USERNAME=admin
ADMIN_PASSWORD=xxx
ADMIN_SECRET=xxx
```

---

## NPM Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run db:generate      # Generate migrations from schema
npm run db:migrate       # Apply migrations to database
```

---

## API Endpoints

### Authentication

```
GET  /api/auth/signin
GET  /api/auth/signout
GET  /api/auth/session
POST /api/auth/register        # Email/password registration
GET  /api/auth/callback/google # OAuth callback
```

### Results & Leaderboards

```
POST /api/results              # Submit game result
POST /api/link-guest           # Link guest to authenticated user
GET  /api/leaderboard/daily?game=wordle&date=YYYY-MM-DD
GET  /api/leaderboard/monthly?game=wordle&month=YYYY-MM
```

---

## Database Schema

### Core Tables

- `users` - User accounts
- `accounts` - OAuth provider data
- `sessions` - Active sessions
- `guest_profiles` - Anonymous players
- `game_results` - All game outcomes

### Key Relationships

- `game_results.user_id` → `users.id`
- `game_results.guest_id` → `guest_profiles.id`
- `accounts.user_id` → `users.id`
- `sessions.user_id` → `users.id`

---

## Client Utilities

### Auth

```javascript
import { useSession, signIn, signOut } from "next-auth/react";

const { data: session, status } = useSession();
// status: 'loading' | 'authenticated' | 'unauthenticated'

await signIn("google");
await signIn("credentials", { email, password });
await signOut();
```

### Guest Management

```javascript
import { ensureGuestId, getGuestId, clearGuestId } from "@/utils/guestManager";

const guestId = ensureGuestId(); // Creates if missing
const existing = getGuestId(); // Returns null if none
clearGuestId(); // Remove guest ID
```

### Results Submission

```javascript
import { submitResult } from "@/utils/resultsClient";

const result = await submitResult({
  gameKey: "wordle",
  mode: "daily",
  success: true,
  attempts: 4,
  durationMs: 45000,
  metadata: { hints: 0 },
});
// Returns: { id: 'uuid', score: 1050 }
```

---

## Server Functions

### Get Session

```typescript
import { auth } from '@/lib/auth';

const session = await auth();
const userId = session?.user?.id;
```

### Database Queries

```typescript
import { db, users, gameResults } from '@/db';
import { eq, desc } from 'drizzle-orm';

// Find user
const user = await db.query.users.findFirst({
  where: eq(users.email, 'user@example.com')
});

// Get results
const results = await db
  .select()
  .from(gameResults)
  .where(eq(gameResults.userId, userId))
  .orderBy(desc(gameResults.playedAt))
  .limit(10);
```

---

## Scoring Formulas

| Game         | Base            | Penalties                   | Notes          |
| ------------ | --------------- | --------------------------- | -------------- |
| Wordle       | 1200            | -120/attempt, -1/2s         | Win-only       |
| Connections  | 1000            | -120/mistake, -1/3s         | Win-only       |
| Crossword    | 1500            | -150/hint, -1/2s            | Win-only       |
| Numbers      | 1400/800        | -40/offset, -30/move, -1/2s | Partial credit |
| Trivia       | 1200 × accuracy | +20/streak, -1/3s           | Partial credit |
| Strands      | 1300            | -120/hint, -1/2s            | Win-only       |
| Spelling     | raw points      | +150/pangram, -1/4s         | Always scores  |
| Waffle       | 1400            | -80/swap, -1/2s             | Win-only       |
| Combinations | 1200            | -40/move, -1/2s             | Win-only       |

---

## Common Commands

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Check Database

```sql
SELECT * FROM users LIMIT 10;
SELECT * FROM game_results ORDER BY played_at DESC LIMIT 20;
SELECT game_key, COUNT(*) FROM game_results GROUP BY game_key;
```

### Reset Migrations

```bash
rm -rf drizzle
npm run db:generate
npm run db:migrate
```

---

## Deployment Checklist

- [ ] Rotate any exposed `DATABASE_URL`
- [ ] Generate fresh `NEXTAUTH_SECRET` for production
- [ ] Add all env vars to Netlify
- [ ] Update Google OAuth redirect URIs
- [ ] Run `npm run db:migrate` in production
- [ ] Test login flow
- [ ] Test guest → user linking
- [ ] Verify leaderboards populate

---

## Troubleshooting

### "DATABASE_URL is not set"

Add to `.env.local` or Netlify env vars

### "No matching version found for..."

Check `package.json` versions match available packages

### Google OAuth fails

Verify redirect URI in Google Console matches exactly

### Leaderboard empty

- Ensure playing in **daily mode**
- Ensure user is **authenticated**
- Check `game_results` table in database

### Results not saving

- Check browser console for errors
- Check Netlify function logs
- Verify `DATABASE_URL` is correct

---

## File Structure

```
src/
├── db/
│   ├── index.ts          # DB client
│   └── schema.ts         # Table definitions
├── lib/
│   └── auth.ts           # NextAuth config
├── server/
│   └── scoring/          # Server-side scoring
│       ├── index.ts
│       ├── wordle.ts
│       └── ...
├── app/api/
│   ├── auth/
│   │   ├── [...nextauth]/route.ts
│   │   └── register/route.ts
│   ├── results/route.ts
│   ├── link-guest/route.ts
│   └── leaderboard/
│       ├── daily/route.ts
│       └── monthly/route.ts
├── components/
│   ├── AuthProvider.tsx
│   ├── AuthModal.tsx
│   └── AuthButton.tsx
└── utils/
    ├── guestManager.ts
    └── resultsClient.ts
```

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [NextAuth Docs](https://authjs.dev/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Neon Docs](https://neon.tech/docs)
- [Netlify Docs](https://docs.netlify.com/)

---

**Updated**: January 2026
