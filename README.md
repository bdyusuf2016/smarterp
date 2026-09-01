# SmartERP Enterprise Platform V2.0

> **বাংলাদেশের জন্য তৈরি সম্পূর্ণ মাল্টি-টেন্যান্ট বিজনেস ম্যানেজমেন্ট প্ল্যাটফর্ম ও ERP/POS সিস্টেম**

## 🚀 ফিচার সমূহ

### ✅ Core Business Modules
- **POS (পয়েন্ট অব সেল)** — বিক্রয় মেমো, বারকোড স্ক্যান, ক্যাশ ড্রয়ার, রসিদ প্রিন্ট
- **Product & Inventory Catalog** — ডায়নামিক ক্যাটাগরিভিত্তিক পণ্য ব্যবস্থাপনা (IMEI, Batch/Expiry, Weight, Book, Generic)
- **Customer & Due Management** — কাস্টমার প্রোফাইল, বাকি হিসাব ও লয়্যালটি পয়েন্ট
- **Supplier & Bill Payment** — সাপ্লায়ার বিল পেমেন্ট, লেনদেন ও বকেয়া ম্যানেজমেন্ট
- **Double-Entry Accounting** — General Ledger, Trial Balance ও Financial Statement
- **Reports & Dashboard** — লাভ-ক্ষতি, খরচ, বিক্রয় সারসংক্ষেপ রিপোর্ট

### 🏪 Multi-Category Business Support (10+ Industries)
| ক্যাটাগরি | ট্র্যাকিং মোড | উদাহরণ |
|-----------|---------------|--------|
| টেলিকম ও মোবাইল শপ | IMEI + Warranty | Samsung, Xiaomi, Accessories |
| মুদি ও সুপারশপ | Batch + Expiry + Weight | চাল, তেল, ডাল, দুধ |
| বই-খাতা ও স্টেশনারি | Book (Author/ISBN/Edition) | গাইড, খাতা, পেন, ক্যালকুলেটর |
| ডিজিটাল সার্ভিস | Service Rate Card | ফটোকপি, প্রিন্ট, লেমিনেটিং |
| ফার্মেসি | Batch + Expiry + Generic Name | ঔষধ, সিরাপ, মেডিকেল সরঞ্জাম |
| ফ্যাশন ও পোশাক | Size + Color + Barcode | শার্ট, জিন্স, পাঞ্জাবি, শাড়ি |
| ইলেকট্রনিক্স | Serial Number + Warranty | TV, Fridge, Gadgets |
| রেস্তোরাঁ ও ক্যাফে | KOT / Menu Items | বিরিয়ানি, বার্গার, কফি |
| হার্ডওয়্যার ও স্যানিটারি | Weight/Length/Pcs | সিমেন্ট, পাইপ, LED |
| জেনারেল রিটেইল | Generic Quantity | বিবিধ ভোগ্যপণ্য |

### ⚡ Auto-Init Catalog Engine
নতুন দোকান যুক্ত করলে ক্যাটাগরি অনুযায়ী স্বয়ংক্রিয়ভাবে মাস্টার পণ্য ক্যাটালগ তৈরি হয়।

### ☁️ Supabase Cloud Database Integration
- Supabase PostgreSQL ক্লাউড ডেটাবেজে সরাসরি কানেকশন
- লাইভ কানেকশন টেস্ট (Ping + Latency ms)
- Global Settings > Supabase ট্যাবে URL/Key কনফিগারেশন

### 🏢 Enterprise Features
- **Multi-Tenant Architecture** — একাধিক দোকান/শাখা ম্যানেজমেন্ট
- **RBAC (Role-Based Access Control)** — 6 টি রোল, 30+ পারমিশন
- **Professional Print Reports** — A4 Corporate Letterhead, Security Hash
- **Barcode Studio** — বারকোড/QR কোড জেনারেশন ও প্রিন্ট
- **Audit Trail** — সকল কার্যক্রমের বিস্তারিত লগ

## 🛠️ Technology Stack

| Technology | Purpose |
|-----------|---------|
| React 19 + TypeScript | Frontend UI |
| Vite 6 | Build & Dev Server |
| Supabase (PostgreSQL) | Cloud Database |
| Drizzle ORM | Database Schema & Migrations |
| Express.js | Backend API Server |
| Lucide React | Icon System |
| Motion (Framer) | Animations |
| Zod | Input Validation |

## 📦 Quick Start

```bash
# Clone the repository
git clone https://github.com/bdyusuf2016/smarterp.git
cd smarterp/dokanmanager-v2

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev

# Open in browser
# http://localhost:5173
```

## ⚙️ Supabase Setup

1. [Supabase](https://supabase.com/) এ একটি নতুন প্রজেক্ট তৈরি করুন
2. **SQL Editor** এ `supabase-schema.sql` ফাইলটি রান করুন
3. **Project Settings > API** থেকে URL এবং Anon Key কপি করুন
4. `.env` ফাইলে অথবা **Global Settings > Supabase** ট্যাবে পেস্ট করুন
5. **"🔌 টেস্ট কানেকশন"** বাটনে ক্লিক করে কানেকশন পরীক্ষা করুন

## 📄 License

© 2026 SmartERP Enterprise. সর্বস্বত্ব সংরক্ষিত।
