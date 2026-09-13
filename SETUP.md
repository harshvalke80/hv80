# H & S Wedding Site — Google Sheets RSVP + Hosting

## Files
- `index.html` — public wedding site (RSVP form posts to the endpoint)
- `host.html` — private host dashboard (enter host key to see all RSVPs)
- `apps-script/Code.gs` — backend; paste into Google Apps Script

## Endpoints (one Web App URL: `https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec`)

| Method | Body (form-encoded)                              | Response |
|--------|--------------------------------------------------|----------|
| POST   | `name`, `attending`, `guests`, `guestNames`      | `{ ok: true }` — row appended to sheet `RSVPs` |
| POST   | `action=list`, `key=<HOST_KEY>`                  | `{ ok, summary: {responses, attending, declined, totalGuests}, rsvps: [...] }` |
| GET    | —                                                | `{ ok: true, service: "H&S RSVP" }` health check |

Errors return `{ ok: false, error: "..." }`.

## 1. Create the Sheet + script
1. Create a new Google Sheet (e.g. "H&S RSVPs").
2. **Extensions → Apps Script**. Delete the default code, paste all of `apps-script/Code.gs`, save.
3. **Project Settings (gear) → Script properties → Add property**:
   `HOST_KEY` = a long secret phrase only the hosts know.

## 2. Deploy as Web App
1. **Deploy → New deployment → type: Web app**.
2. Execute as: **Me**. Who has access: **Anyone**.
3. Authorize when prompted, then copy the **Web app URL** (ends in `/exec`).
4. Paste it into `RSVP_ENDPOINT` in **both** `index.html` and `host.html`.

Updating the script later: **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**.
This keeps the same URL (a "New deployment" creates a new URL).

## 3. Test
- Open the `/exec` URL in a browser → should show `{"ok":true,"service":"H&S RSVP"}`.
- Submit the RSVP form on `index.html` → a row appears in the `RSVPs` tab.
- Open `host.html`, enter the host key → stats and table load.

## 4. Host the site (free options)
- **Netlify Drop**: go to app.netlify.com/drop, drag the whole folder in. Done.
- **GitHub Pages**: push `index.html` + `host.html` to a repo → Settings → Pages → deploy from `main` / root.
- **Cloudflare Pages / Vercel**: connect the repo or upload the folder.

`host.html` is marked `noindex` and data is protected by the host key, but don't link to it from the public site.
