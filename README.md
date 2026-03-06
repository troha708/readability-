# Readability

A [Next.js](https://nextjs.org) app with [Tailwind CSS](https://tailwindcss.com) and [Supabase](https://supabase.com) authentication.

## Getting started

### 1. Create a Supabase project

1. Go to [database.new](https://database.new) and create a new project
2. In your project, go to **Settings** → **API** and copy the **Project URL** and **anon public** key

### 2. Configure environment variables

Copy the example env file and add your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your values:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You can sign up at `/signup` and sign in at `/login`.

## Scripts

- `npm run dev` – start the dev server
- `npm run build` – build for production
- `npm run start` – start the production server
- `npm run lint` – run ESLint

## Project structure

- `src/app/` – App Router pages and layout
- `src/app/login/` – sign in page
- `src/app/signup/` – sign up page
- `src/app/auth/callback/` – OAuth/email confirmation callback
- `src/lib/supabase/` – Supabase client utilities
