# Portfolio: Mohamed Abderrahmane Heouaine, AI & Data Engineer

A one-page professional portfolio (hero with an interactive 3D galaxy, about, experience, projects, skills, education and certifications, contact), a case-study page per project (`#/projects/<slug>`), and every project as a planet in a 3D galaxy (`#/galaxy`). An admin section (`#/admin`) edits the profile, experience, skills and projects, and uploads the photo, project images and the CV (PDF), without touching code.

- **`backend/`**: NestJS 11 API. Postgres in production (Neon), embedded PGlite locally, plain-SQL migrations in `backend/migrations/`.
- **`web/`**: React 19 + Vite, with three.js through react-three-fiber. The 3D scene is lazy-loaded, and there's a list view for small screens or browsers without WebGL.

## Run it locally

```bash
npm --prefix backend install
```
```bash
npm --prefix web install
```
```bash
npm --prefix backend run dev
```
```bash
npm --prefix web run dev
```

The API runs on http://localhost:3100 and the site on http://localhost:5180 (Vite forwards `/api`). Without `DATABASE_URL`, data lives in `backend/.data/`.

To use the admin section locally, copy `backend/.env.example` to `backend/.env` and fill in `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH`. Generate the hash with the command below (the password is typed hidden and never stored), then open http://localhost:5180/#/admin.

```bash
npm --prefix backend run hash-password
```

Tests:

```bash
npm --prefix backend test
```
```bash
npm --prefix web test
```

## Admin

- One admin account, defined by the `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` environment variables. There is no sign-up.
- Sign-in sets an 8-hour, httpOnly, `SameSite=Strict` cookie. Writes also require an `X-Portfolio-Client` header, and sign-in is limited to 5 attempts per minute.
- Changing `ADMIN_PASSWORD_HASH` signs out every existing session.
- Projects have a title, slug, category (which becomes an orbit), period, summary, description, highlights, tags, code and demo links, an image (PNG/JPEG/WebP/GIF, up to 4 MB, stored in Postgres), a planet colour, and featured and published flags. Drafts are visible only in the admin section.
- The Profile tab edits the name, headline, bio and links shown on the central star.

## Deploy (Vercel + Render + Neon)

1. **Database:** create a Neon project (or a new database in an existing one) and copy its connection string, ending in `?sslmode=verify-full`. Migrations run automatically when the API starts.
2. **API:** in Render, create a Blueprint from this repository (`render.yaml`). Fill in `DATABASE_URL`, `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH`. `JWT_SECRET` is generated for you.
3. **Web:** in Vercel, import the repository with **Root Directory `web`** (framework preset: Vite). If Render gave the API a different URL than `https://sasukeaizen7-portfolio-api.onrender.com`, update the rewrite in `web/vercel.json`.

The browser only ever talks to the Vercel domain: Vercel forwards `/api/*` to Render, so cookies stay first-party and the API needs no CORS.

Render's free plan sleeps after 15 idle minutes, so the first visit after a pause takes up to a minute while the API wakes up.
