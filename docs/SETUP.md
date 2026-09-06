# Wally — local setup

## 1. Install & database

```bash
pnpm install
cp .env.example .env          # if you don't already have .env
pnpm db:migrate               # needs a reachable PostgreSQL (DATABASE_URL / DIRECT_URL)
pnpm dev                      # http://localhost:3000
```

The app boots and every page renders without any third-party credentials.
Only actual Google sign-in needs the step below.

## 2. Google OAuth (fixes "Access blocked: Authorization Error / Missing required parameter: client_id")

That error means `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` are still empty, so
Auth.js sends Google an OAuth request with no `client_id`. Wally now hides the
sign-in button until these are set — fill them in to enable login.

1. Go to **Google Cloud Console → APIs & Services → Credentials**
   (https://console.cloud.google.com/apis/credentials). Create a project if needed.
2. **Configure the OAuth consent screen** (once):
   - User type: **External**
   - App name: `Wally`, support email: your email
   - Scopes: the defaults (`openid`, `email`, `profile`) are enough
   - Add your Google account under **Test users** while the app is in "Testing"
3. **Create credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorized JavaScript origins:**
     - `http://localhost:3000`
     - your deployed origin, e.g. `https://wally.vercel.app`
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/auth/callback/google`
     - `https://<your-domain>/api/auth/callback/google`
4. Copy the **Client ID** and **Client secret** into `.env`:

   ```
   AUTH_GOOGLE_ID="xxxxxxxx.apps.googleusercontent.com"
   AUTH_GOOGLE_SECRET="GOCSPX-xxxxxxxx"
   ```

5. Also set a real `AUTH_SECRET` (any long random string):

   ```bash
   npx auth secret        # writes AUTH_SECRET to .env
   # or: openssl rand -base64 33
   ```

6. Restart `pnpm dev`. The "Continue with Google" button reappears.
   First sign-in seeds your default categories; add your email to
   `ADMIN_EMAILS` in `.env` before first sign-in to get the admin role.

On Vercel, set the same variables as Environment Variables. `CRON_SECRET` is
also required there (used by the daily FX cron in `vercel.json`).

## 3. Dev shortcut (no Google needed)

For local UI work without OAuth, create a throwaway user + session:

```bash
pnpm dev:user
# prints:  cookie header: authjs.session-token=dev-session-token-0000000000000000
```

Set that cookie in your browser (DevTools → Application → Cookies) for
`http://localhost:3000`, then open `/dashboard`.

## 4. Optional integrations

| Variable | Used by | Notes |
| --- | --- | --- |
| `FINNHUB_API_KEY` | Phase 2 stock prices | free tier at https://finnhub.io (60 req/min) |
| `CRON_SECRET` | `/api/cron/*` | any random string; required on Vercel |

FX rates need no key (frankfurter.app). Backfill history once with
`pnpm fx:backfill 420`.
