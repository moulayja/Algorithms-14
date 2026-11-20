# Text Helper

Fix or write text messages and emails in natural English or French, without the AI sound.

- **Check my text**: you write your reply, it fixes typos, grammar, and awkward phrasing, and shows what changed.
- **Write reply for me**: paste the message you got, and optionally add notes ("say yes, 3pm"), and it writes the reply.
- Tone: Auto / Casual / Friendly / Pro. Language: Auto / English / Français.

Stack: Next.js + TypeScript, deployed on Vercel, using the Claude API on the server so your key never reaches the phone.

## 1. Get an Anthropic API key

1. Go to console.anthropic.com and sign up.
2. Add a few dollars of credit (Billing). Each check costs a fraction of a cent.
3. Create an API key (API Keys > Create Key) and keep it somewhere safe.

## 2. Put it online with Vercel (free)

1. Go to vercel.com and sign in with GitHub.
2. **Add New > Project**, pick the `Algorithms-14` repository.
3. Set **Root Directory** to `text-helper`.
4. Under **Environment Variables**, add:
   - `ANTHROPIC_API_KEY`: your key from step 1
   - `APP_PASSWORD`: any long password you choose. It stops strangers from using your credits.
5. Click **Deploy**. You get a link like `https://text-helper-xxxx.vercel.app`.

## 3. Install it on your iPhone

1. Open your Vercel link in **Safari**.
2. Tap the **Share** button, then **Add to Home Screen**.
3. Open Text Helper from your home screen, tap **Settings**, and enter your `APP_PASSWORD` once.

Daily use: copy the message you got, open Text Helper, tap **Paste**, write your reply or notes, tap **Check my text** or **Write reply for me**, tap **Copy**, and paste it in Messages, WhatsApp, or Mail.

## 4. Optional: "Fix my text" from the Share menu

This lets you select text in any app, tap **Share > Fix my text**, and get the corrected version copied.

In the **Shortcuts** app, create a new shortcut named **Fix my text** with these actions:

1. **Receive** *Text* input from *Share Sheet* (turn on "Show in Share Sheet" in the shortcut's settings).
2. **Get Contents of URL**
   - URL: `https://YOUR-LINK.vercel.app/api/fix`
   - Method: `POST`
   - Headers: `x-app-password` = your APP_PASSWORD
   - Request Body: `JSON`, with fields `mode` = `check`, `draft` = *Shortcut Input*
3. **Get Dictionary Value** for key `text` in *Contents of URL*.
4. **Copy to Clipboard**.
5. **Show Notification**: "Fixed and copied ✓".

Tip: "Hey Siri, fix my text" runs it too.

## Run it on a computer (for development)

```bash
cd text-helper
npm install
cp .env.example .env.local   # then fill in the two values
npm run dev                  # open http://localhost:3000
npm test                     # unit tests
npm run build                # production build check
```

## API

`POST /api/fix` with header `x-app-password` and a JSON body:

```json
{ "mode": "check", "draft": "ok see you tomorow", "received": "", "tone": "auto", "language": "auto" }
```

`mode` is `check` or `reply`, `tone` is `auto | casual | friendly | professional`, `language` is `auto | en | fr`. Returns `{ "text": "..." }` or `{ "error": "..." }`.
