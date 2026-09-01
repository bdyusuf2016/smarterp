# SmartERP Enterprise — Setup & Installation Guide

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ or **yarn**
- **Git**
- **Supabase Account** (Free tier is sufficient)

## Step 1: Clone & Install

```bash
git clone https://github.com/bdyusuf2016/smarterp.git
cd smarterp/dokanmanager-v2
npm install
```

## Step 2: Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

> **Note**: You can also configure Supabase credentials from the app UI at  
> **Global Settings > ক্লাউড ডেটাবেজ ও Supabase** tab.

## Step 3: Database Setup (Supabase)

1. Go to [supabase.com](https://supabase.com/) and create a new project
2. Open **SQL Editor** in the Supabase Dashboard
3. Copy & paste the contents of `supabase-schema.sql` from the project root
4. Click **Run** to create all tables

## Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Step 5: First-Time Setup

1. **Login** with the default demo credentials (or create a new tenant)
2. Go to **টেন্যান্ট ম্যানেজমেন্ট** to create your shop
3. Select your **Business Categories** (e.g., Telecom, Grocery, Bookstore)
4. The **Auto-Init Catalog Engine** will automatically populate starter products
5. Go to **Global Settings > Supabase** tab and click **"🔌 টেস্ট কানেকশন"** to verify cloud DB

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Production build |
| `npm run lint` | TypeScript type check (`tsc --noEmit`) |
| `npm test` | Run Vitest test suite |
| `npm run db:seed` | Seed database with sample data |

## Project Structure

```
dokanmanager-v2/
├── src/
│   ├── components/views/    # All UI views (POS, Products, Settings, etc.)
│   ├── engine/              # Business logic engines
│   │   ├── catalogInitEngine.ts   # Auto-Init Product Catalog
│   │   ├── navigationEngine.ts    # Dynamic Navigation
│   │   ├── rbacEngine.ts          # Role-Based Access Control
│   │   ├── ruleEngine.ts          # Validation Rules
│   │   └── workflowEngine.ts      # Sale Pipeline & Accounting
│   ├── services/
│   │   ├── storageService.ts      # LocalStorage Data Layer
│   │   ├── supabaseClient.ts      # Supabase Cloud DB Client
│   │   ├── i18nService.ts         # Bilingual i18n (Bengali/English)
│   │   └── authService.ts         # Authentication & User Profiles
│   └── types/index.ts             # TypeScript Interfaces
├── supabase-schema.sql      # Full PostgreSQL schema for Supabase
├── .env.example             # Environment template
└── package.json
```

## Support

For issues or questions, please open an issue on GitHub.
