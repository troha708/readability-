# NIV Bible data

Source: [aruljohn/Bible-niv](https://github.com/aruljohn/Bible-niv) (MIT).

- **Download:** `npm run bible:download` (saves each book as `data/niv/<BookName>.json`)
- **Seed DB:** Run the Supabase migration first, then `npm run bible:seed` (requires env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

Chunks are built to ~1500 words, breaking at verse boundaries and preferring to start/end at heading-like verses when possible.
