# 🚀 Ammar Times - Deployment & Setup Guide

This guide walks you through setting up the backend infrastructure and deploying Ammar Times to production.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup (Neon Postgres)](#database-setup-neon-postgres)
4. [Google OAuth Setup](#google-oauth-setup)
5. [Running Locally](#running-locally)
6. [Deploying to Netlify](#deploying-to-netlify)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** 18+ and npm
- **Git** for version control
- **Neon account** (free tier available at [neon.tech](https://neon.tech))
- **Google Cloud account** (for OAuth)
- **Netlify account** (free tier available)

---

## Local Development Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ammar_times
npm install
```

### 2. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

**DO NOT commit `.env.local` to Git** (already in `.gitignore`).

---

## Database Setup (Neon Postgres)

### 1. Create Neon Project

1. Go to [neon.tech](https://neon.tech) and sign up/login
2. Click **"New Project"**
3. Choose a name (e.g., `ammar-times-db`)
4. Select a region close to your users
5. Click **"Create Project"**

### 2. Get Connection String

1. In your Neon dashboard, go to **Connection Details**
2. Select **"Pooled connection"** (important for serverless)
3. Copy the connection string
   - Format: `postgres://user:password@host.neon.tech:5432/dbname?sslmode=require`

### 3. Add to Environment

In your `.env.local`:

```env
DATABASE_URL=postgres://your-user:your-password@your-host.neon.tech:5432/your-db?sslmode=require
```

⚠️ **SECURITY**: If this connection string was ever exposed (committed to Git, logged, etc.), **rotate the password immediately** in Neon dashboard and generate a new connection string.

### 4. Run Migrations

```bash
# Generate migration files from schema
npm run db:generate

# Apply migrations to database
npm run db:migrate
```

You should see output confirming tables were created:

- `users`
- `accounts`
- `sessions`
- `verification_tokens`
- `guest_profiles`
- `game_results`

---

## Google OAuth Setup

### 1. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API** (may be auto-enabled)
4. Navigate to **APIs & Services > Credentials**
5. Click **"Create Credentials" > "OAuth 2.0 Client ID"**
6. Select **"Web application"**
7. Add **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (for local dev)
   - `https://<your-site>.netlify.app/api/auth/callback/google` (for production)
8. Click **"Create"**
9. Copy **Client ID** and **Client Secret**

### 2. Add to Environment

In your `.env.local`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
```

---

## Generate NextAuth Secret

You need a strong random secret for session encryption:

```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add to `.env.local`:

```env
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=http://localhost:3000
```

---

## Running Locally

### Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### Test Authentication

1. Click **"Sign In"** in the header
2. Try **"Continue with Google"** (should redirect to Google OAuth)
3. Try **"Register"** with email/password
4. Try **"Continue as Guest"** (creates local guest ID)

### Test Leaderboards

1. Play a game in **daily mode** while logged in
2. Navigate to **🏆 Leaderboard**
3. Select the game and view **Daily** or **Monthly** rankings

---

## Deploying to Netlify

### 1. Push to GitHub

Ensure your code is in a GitHub repository (private or public).

### 2. Connect to Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **"Add new site" > "Import an existing project"**
3. Choose **GitHub** and authorize
4. Select your repository
5. Build settings (should auto-detect):
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
6. Click **"Deploy site"**

### 3. Add Environment Variables

In Netlify dashboard, go to **Site settings > Environment variables** and add:

| Variable               | Value                                    |
| ---------------------- | ---------------------------------------- |
| `DATABASE_URL`         | Your Neon pooled connection string       |
| `NEXTAUTH_SECRET`      | Generate a **NEW** secret for production |
| `NEXTAUTH_URL`         | `https://your-site-name.netlify.app`     |
| `GOOGLE_CLIENT_ID`     | Your Google OAuth client ID              |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth client secret          |

⚠️ **CRITICAL**: Use a **different** `NEXTAUTH_SECRET` for production than your local dev environment.

### 4. Update Google OAuth

1. Go back to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Add production redirect URI:
   - `https://your-site-name.netlify.app/api/auth/callback/google`
4. Save

### 5. Redeploy

After adding environment variables, trigger a redeploy:

- **Deploys > Trigger deploy > Deploy site**

---

## Post-Deployment Verification

### ✅ Checklist

- [ ] Site loads at `https://your-site.netlify.app`
- [ ] **Sign in with Google** works end-to-end
- [ ] **Register with email/password** creates account
- [ ] **Continue as Guest** works (stores guest ID in localStorage)
- [ ] Playing a game while logged in submits results
- [ ] **Leaderboard** shows daily and monthly rankings
- [ ] Logging in after being a guest **links** guest results to account
- [ ] No secrets are visible in browser DevTools or page source
- [ ] Database tables populated correctly (check Neon dashboard)

### Common Issues

| Problem                     | Solution                                                          |
| --------------------------- | ----------------------------------------------------------------- |
| "Sign in with Google" fails | Verify redirect URI in Google Console matches Netlify URL exactly |
| "Invalid session" errors    | Regenerate `NEXTAUTH_SECRET` and redeploy                         |
| Leaderboard empty           | Ensure you're playing in **daily mode** while authenticated       |
| Results not saving          | Check Netlify function logs for API errors                        |
| Guest link not working      | Check localStorage for `ammar_guest_id` before logging in         |

---

## Troubleshooting

### View Netlify Function Logs

1. Go to **Netlify dashboard > Functions**
2. Click on a function (e.g., `___netlify-handler`)
3. View real-time logs

### Common Errors

**"DATABASE_URL is not set"**

- Add `DATABASE_URL` to Netlify environment variables
- Redeploy

**"NEXTAUTH_SECRET is not set"**

- Add `NEXTAUTH_SECRET` to Netlify environment variables
- Redeploy

**"Failed to link guest"**

- Ensure `ammar_guest_id` exists in localStorage before logging in
- Check API logs for errors

**Google OAuth redirect mismatch**

- Ensure redirect URI in Google Console exactly matches Netlify URL
- Include `/api/auth/callback/google` path

### Database Issues

Check Neon dashboard:

1. **SQL Editor** - Run queries to inspect data:
   ```sql
   SELECT * FROM users LIMIT 10;
   SELECT * FROM game_results ORDER BY played_at DESC LIMIT 20;
   ```
2. **Monitoring** - Check connection count and query performance

---

## Security Best Practices

✅ **DO:**

- Use different secrets for dev/staging/production
- Rotate `NEXTAUTH_SECRET` every 90 days
- Use environment variables for all secrets
- Review Netlify access logs regularly
- Keep dependencies updated

❌ **DON'T:**

- Commit `.env.local` to Git
- Share `DATABASE_URL` publicly
- Reuse passwords across environments
- Trust client-submitted scores (we compute server-side)

---

## Scaling Considerations

As your user base grows:

1. **Database**: Upgrade Neon plan for more compute/storage
2. **Caching**: Add Redis for leaderboard caching
3. **Rate Limiting**: Implement rate limits on results submission
4. **Monitoring**: Add error tracking (Sentry, LogRocket)
5. **Analytics**: Track game engagement (PostHog, Mixpanel)

---

## Support

For issues:

1. Check [Next.js docs](https://nextjs.org/docs)
2. Check [NextAuth docs](https://authjs.dev/)
3. Check [Drizzle ORM docs](https://orm.drizzle.team/)
4. Check Netlify deployment logs

---

**🎉 Congratulations! Your Ammar Times platform is now live with full backend support.**
