## Google OAuth integration

This folder documents the Google OAuth (Gmail authentication) flow implemented in the project.

Backend:
- `backend/main.py` exposes `POST /auth/google`, which:
  - Verifies the Google ID token using `google.oauth2.id_token.verify_oauth2_token` and `GOOGLE_CLIENT_ID` from `.env`.
  - Supports both `login` and `signup` intents for **customers** and **providers**.
  - On **login**:
    - If the user exists and is active, issues a normal JWT and links their `google_id` and profile picture.
    - If the user does not exist, returns `needs_signup: true` plus verified email/name so the frontend can redirect to signup.
  - On **signup**:
    - Returns verified `email` and `name` so signup forms can be pre-filled with a locked email field.

Frontend:
- Shared Google button component at `glowsense-web/src/components/GOOGLE AUTH/GoogleAuthButton.tsx`.
- Used on:
  - `login/customer` and `login/provider` pages for **“Sign in with Google”**.
  - `signup/customer` and `signup/provider` pages for **“Continue with Google”** and pre-filling email.
- The root `app/layout.tsx` loads the Google Identity Services script and the button reads `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

Environment variables:
- `.env` (backend): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- `.env.local` for `glowsense-web` (frontend): `NEXT_PUBLIC_GOOGLE_CLIENT_ID` must match `GOOGLE_CLIENT_ID`.

