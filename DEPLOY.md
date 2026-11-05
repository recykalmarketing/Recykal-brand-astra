# Deploying Brand Astra on Render (free)

Brand Astra is Recykal's brand QC and task dashboard. This repository runs it as a small Node server:

- **Sign-in:** Google, restricted to @recykal.com accounts. On the sign-in page people choose **Employee** or **Marketing team**. The marketing team is the owners listed in `src/Code.gs` (`CONFIG.ADMINS`) plus anyone added in the app under **Team & access**.
- **Data:** a free [Neon](https://neon.tech) Postgres database. Render's own free database is deleted after 30 days, so it isn't used.
- **Cost:** nothing. Render's free web service sleeps after 15 minutes without visitors, so the first person to open it after a quiet spell waits about a minute.

Setup takes about 30 minutes, in this order: Neon, Render, Google sign-in, then email (optional).

## 1. Create the database (Neon)

1. Sign up at **neon.tech** (the free plan; signing in with GitHub is quickest).
2. Create a project named `brand-astra`. Choose the region **AWS Asia Pacific (Singapore)**, close to Render's Singapore region.
3. On the project dashboard, click **Connect** and copy the connection string. It looks like `postgresql://…@….neon.tech/neondb?sslmode=require`. Keep it for step 2.

Brand Astra creates its two tables on first start.

## 2. Create the web service (Render)

1. In Render, click **New → Blueprint** and connect this GitHub repository. Render reads `render.yaml` and proposes a free web service named **brand-astra**.
2. When it asks for values, fill in **DATABASE_URL** with the Neon connection string. Leave the Google and email values empty for now, then click **Apply**.
3. When the deploy finishes, open the service's address, for example `https://brand-astra.onrender.com`. It shows **Brand Astra isn't set up yet** and the exact redirect address for step 3. Copy that address.

## 3. Turn on Google sign-in

Do this signed in to Google with a Recykal account. If Google says you can't create projects, ask your Google Workspace admin to do steps 1–4.

1. Go to **console.cloud.google.com**. Create a project named `Brand Astra` in the **recykal.com** organisation.
2. Open **APIs & Services → Library**, search for **Google Drive API** and click **Enable**. This lets Brand Astra check Google Slides and Docs links. Each person's own Google access is used, only for files they can already open.
3. Open **APIs & Services → OAuth consent screen**. Choose **Internal**, so only @recykal.com accounts can sign in and Google needs no app review. Set the app name to `Brand Astra` and the support email to marketing@recykal.com, then save.
4. Open **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Name: `Brand Astra on Render`
   - Authorised redirect URIs: the address from step 2, for example `https://brand-astra.onrender.com/auth/callback`
5. Click **Create** and copy the **Client ID** and **Client secret**.
6. Back in Render, open the service → **Environment**, set **GOOGLE_CLIENT_ID** and **GOOGLE_CLIENT_SECRET**, and save. Render restarts the app.

Open the address again. You'll see **Sign in with Google**.

## 4. Email (optional)

Without email, everything still appears in the app's notification bell. To send decisions, assignments, reminders and the morning digest by email from marketing@recykal.com:

1. Sign in to Google as marketing@recykal.com. Turn on 2-Step Verification if it isn't already on.
2. Go to **myaccount.google.com/apppasswords**, create an app password named `Brand Astra`, and copy the 16 letters. If the page says app passwords aren't available, your Workspace admin has to allow them.
3. In Render → **Environment**, set **SMTP_USER** to `marketing@recykal.com` and **SMTP_PASS** to the app password, then save.

The morning digest is sent with the first visit after 9 am each day, because the free service sleeps instead of running a timer.

## 5. Roll out

1. Open the app and sign in with **Marketing team** using one of the owner accounts in `src/Code.gs`.
2. Add the rest of the marketing team under **Team & access**. New members get an email if email is on.
3. Post your first request under **Requests**, and paste your template links under **Brand kit → Templates**.
4. Share the address with your team. Each person signs in with Google, confirms their name and team, and picks **Employee**.

**Backups:** marketing team members can download every record as JSON from the **Download data backup** button on the overview. Neon's free plan also keeps a short restore history.

## Making changes

- **Brand rules and the dashboard:** edit the files in `src/` (`rules.js` for the rules, `check.js` for how files are measured, `app.html` for the page, `Code.gs` for the server logic). Then run `python3 src/build.py`, which rebuilds `app/`.
- **Marketing team owners:** edit `ADMINS` at the top of `src/Code.gs` and rebuild.
- **Deploy:** commit and push. Render deploys every push to the main branch automatically.
- **Run it on your computer:** `npm install`, then `npm run dev`, and open http://localhost:3000. Without Google settings it offers a test sign-in for any @recykal.com address, and keeps data in `data/`.

## Settings (Render → Environment)

| Name | What it is |
|---|---|
| `DATABASE_URL` | Neon connection string (required) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in client from step 3 (required) |
| `SESSION_SECRET` | Created automatically by the blueprint. Changing it signs everyone out |
| `SMTP_USER`, `SMTP_PASS` | Optional email, step 4 |
| `BASE_URL` | Only for a custom domain, e.g. `https://brand.recykal.com`. Also add its `/auth/callback` in Google |
| `GOOGLE_DRIVE` | Set to `0` to stop asking for read access to Google Drive. Google links then can't be checked automatically; uploads still can |
