# ⚽ WC 2026 Sticker Tracker

Track your physical FIFA World Cup 2026 Panini sticker collection and trade with friends.

## How it works

**Album grid** — tap a sticker cell once to mark it as stuck in your album. Tap again to remove it.

**Duplicates pile** — completely separate from the album. When you type a sticker ID you already have in your album, it goes here instead. Each duplicate shows a − button so you can subtract one when you trade it away.

**Promote modal** — if you tap a sticker out of your album but you have a duplicate of it, the app asks if you want to move the duplicate into the album slot automatically.

**Bulk input** — type sticker IDs exactly as they appear on the sticker: `SUI-15, ARG-3, USA-7` and hit Enter or Add.

---

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Enable friend sharing (Firebase)

1. Go to https://console.firebase.google.com → sign in with Google
2. Add project → name it anything → Continue through all steps
3. Build → Realtime Database → Create Database → United States → test mode → Enable
4. Copy the URL shown (looks like: `https://your-project-default-rtdb.firebaseio.com`)
5. Create a file called `.env` in the root of this folder with:
   ```
   VITE_FIREBASE_URL=https://your-project-default-rtdb.firebaseio.com
   ```
6. Restart: `npm run dev`

---

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → import the repo
3. Add environment variable: `VITE_FIREBASE_URL` = your Firebase URL
4. Deploy → share the URL with friends
