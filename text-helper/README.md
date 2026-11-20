# Text Helper

A simple app for your text messages: paste your text, check the grammar, translate it to French or English, copy, and send.

- **Check grammar**: finds spelling, grammar, and punctuation mistakes in English or French. Tap a suggestion to fix one, or **Fix all**.
- **Translate to French / Translate to English**: free machine translation. **Edit & check it** puts the translation back in the box so you can grammar-check it too.
- **Paste** and **Copy** buttons, so you never have to select text by hand.

No API key or account needed. It uses two free public services:

- [LanguageTool](https://languagetool.org) for grammar (about 20 checks per minute).
- [MyMemory](https://mymemory.translated.net) for translation (about 5,000 characters per day for free).

Your text is sent to these services to be checked or translated, so don't paste passwords or anything very private.

## Put it online with Vercel (free)

1. Go to vercel.com and sign in with your GitHub account.
2. Click **Add New → Project** and pick the `Algorithms-14` repository.
3. Set **Root Directory** to `text-helper`.
4. Click **Deploy**. You get a link like `https://text-helper-xxxx.vercel.app`.

Optional: add an environment variable `MYMEMORY_EMAIL` with your email address to raise the free translation limit to about 50,000 characters per day.

## Install it on your iPhone

1. Open your Vercel link in **Safari**.
2. Tap the **Share** button, then **Add to Home Screen**.

Daily use: copy your text, open Text Helper, tap **Paste**, tap **Check grammar** (or a Translate button), tap **Copy**, and paste it in Messages.

Tip: also add the French keyboard (Settings → General → Keyboard → Keyboards → Add New Keyboard → French) so autocorrect helps while you type.

## For development

```bash
cd text-helper
npm install
npm run dev        # open http://localhost:3000
npm test           # unit tests
npm run typecheck
npm run build
```

API routes (both take and return JSON):

- `POST /api/check` with `{ "text": "...", "language": "auto" | "en" | "fr" }` returns `{ "issues": [...], "detected": "..." }`.
- `POST /api/translate` with `{ "text": "...", "to": "fr" | "en" }` returns `{ "text": "..." }`.

Errors come back as `{ "error": "..." }`.
