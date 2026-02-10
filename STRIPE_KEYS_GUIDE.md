# How to Get Your Stripe Publishable Key
## Step-by-Step Guide
### 1. Go to Stripe Dashboard
Visit: https://dashboard.stripe.com/test/apikeys

### 2. Find Your Publishable Key
- Look for the **"Publishable key"** section
- It starts with `pk_test_` (for test mode)
- Click the **"Reveal test key"** button if it's hidden
- Copy the entire key

### 3. Add to Frontend
Create a file called `.env.local` in the `glowsense-web` directory and add:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

**Important Notes:**
- The key must start with `NEXT_PUBLIC_` for Next.js to expose it to the browser
- Replace `pk_test_your_publishable_key_here` with your actual publishable key
- Never commit this file to git (it should be in `.gitignore`)

### 4. Restart Your Next.js Dev Server
After adding the key, restart your development server:
```bash
npm run dev
```

## Your Keys Summary

- **Secret Key** (Backend): `sk_test_YOUR_STRIPE_SECRET_KEY_HERE` (Get from Stripe Dashboard)
  - ✅ Already in `backend/.env`
  - Used for server-side operations (creating payment intents, etc.)

- **Publishable Key** (Frontend): `pk_test_...`
  - ⚠️ You need to get this from Stripe Dashboard
  - Will go in `glowsense-web/.env.local`
  - Used for client-side Stripe Elements (card input, etc.)

## Security Reminder

- ✅ **Secret Key**: Keep it secret! Only use in backend
- ✅ **Publishable Key**: Safe to use in frontend (it's meant to be public)
- ❌ **Never** put secret key in frontend code
- ❌ **Never** commit keys to git

