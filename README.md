# Prarambha Staff Loan Request System — GitHub + Supabase + Vercel

This version is designed for the stack you requested:
- **GitHub** — source code
- **Supabase** — Auth + PostgreSQL + Row Level Security
- **Vercel** — frontend hosting/deployment

## 1. Supabase
1. Create a Supabase project.
2. Open **SQL Editor** and run `supabase-schema.sql`.
3. In **Authentication → Users**, create your first staff user with email/password.
4. Copy the Supabase Project URL and anon/public key.

## 2. GitHub
Upload the contents of this folder to your GitHub repository.

## 3. Vercel
Import the GitHub repository into Vercel.
- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`

Add these Environment Variables in Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Then deploy.

## Local development
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Current functional base
- Supabase email/password login
- Supabase PostgreSQL loan requests
- Supabase Row Level Security foundation
- Dashboard + 5 products + 3 security types + 4 statuses
- Create and list loan requests
- Search and status filtering
- Responsive PWA foundation

Next phases: role-based approval permissions, KYC/document storage, approval workflow, audit events, notifications, reports/exports and offline PWA sync.
