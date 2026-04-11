# Deployed Landing Page

This folder is the clean deployable package for the current working EntryPoint landing page.

## Folder layout

- `index.html`
- `privacy.html`
- `terms.html`
- `disclaimer.html`
- `css/styles.css`
- `js/script.js`
- `api/waitlist.js`
- `assets/images/*`
- `package.json`
- `vercel.json`
- `.env.example`

## Deploy on Vercel

1. Push this folder to your GitHub repo.
2. In Vercel, set the project root to this folder if it is not the repo root.
3. Add the environment variables from `.env.example`.
4. Deploy.

## Supabase requirements

The API expects a `waitlist` table with at least:

- `id`
- `email`

Recommended:

- make `id` the primary key
- make `email` unique

## Environment variables

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `MIN_WAITLIST_DISPLAY` optional, defaults to `37`

## Notes

- `index.html` is based on the current working landing page.
- CSS was normalized to `css/styles.css` for deployment.
- The waitlist form posts to `/api/waitlist`, which is included here for Vercel serverless deployment.
