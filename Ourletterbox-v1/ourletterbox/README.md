# OurLetterBox — a love letter that behaves like a real one

Encrypted client-side, stored server-side only as ciphertext, optional
time-lock and burn-after-reading. Runs entirely on free tiers.

## 1. Create a free Supabase project
- Go to supabase.com → New project (free tier)
- In the SQL Editor, paste and run everything in `supabase-setup.sql`
- Go to Project Settings → API, copy the "Project URL" and "anon public" key

## 2. Set up locally
```
npm install
cp .env.local.example .env.local
```
Paste your Supabase URL and anon key into `.env.local`.

```
npm run dev
```
Visit http://localhost:3000 to write a letter, and the generated
`/letter/[id]` link to open it.

## 3. Deploy for free
- Push this folder to a GitHub repo
- Go to vercel.com → New Project → import the repo
- Add the same two env vars (`NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Vercel's project settings
- Deploy — you get a free `your-project.vercel.app` URL

## How the security works
- The letter text is encrypted in the browser (AES-GCM, key derived from
  your passphrase via PBKDF2) before it's ever sent anywhere.
- The database only ever stores ciphertext, a salt, and an IV — never the
  passphrase or plaintext.
- Send the link and the passphrase through two different channels (e.g.
  link by text, passphrase in person) so a single intercepted message
  can't unlock it.

## Ideas for later
- Voice note attachments
- A reply thread instead of one-shot letters
- Custom wax seal colors/stamps per person
