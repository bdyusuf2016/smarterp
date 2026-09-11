# SmartERP Enterprise — Deployment & Local PostgreSQL Guide
> **কোনো GitHub নির্ভরতা ছাড়া সম্পূর্ণ নিজস্ব সার্ভার ও কম্পিউটারে ব্যবহারের নির্দেশিকা**

---

## সূচিপত্র (Table of Contents)
1. [লোকাল উইন্ডোজে PostgreSQL সেটআপ (Local Windows Setup)](#১-লোকাল-উইন্ডোজে-postgresql-সেটআপ)
2. [একযোগে ফ্রন্টএন্ড ও ব্যাকএন্ড চালনা (Running Local Full-Stack)](#২-একযোগে-ফ্রন্টএন্ড-ও-ব্যাকএন্ড-চালনা)
3. [রিয়েল সার্ভারে ডিপ্লয়মেন্ট: পদ্ধতি ১ - Docker Compose](#৩-রিয়েল-সার্ভারে-ডিপ্লয়মেন্ট-পদ্ধতি-১---docker-compose)
4. [রিয়েল সার্ভারে ডিপ্লয়মেন্ট: পদ্ধতি ২ - Native Ubuntu/Debian (PM2 + Nginx)](#৪-রিয়েল-সার্ভারে-ডিপ্লয়মেন্ট-পদ্ধতি-২---native-ubuntudebian-pm2--nginx)
5. [নিরাপত্তা ও সম্পূর্ণ অফলাইন ডিপ্লয়মেন্ট (Zero-GitHub Deployment)](#৫-নিরাপত্তা-ও-সম্পূর্ণ-অফলাইন-ডিপ্লয়মেন্ট)
6. [PostgreSQL ব্যাকআপ ও রিস্টোর (Backup & Restore)](#৬-postgresql-ব্যাকআপ-ও-রিস্টোর)

---

## ১. লোকাল উইন্ডোজে PostgreSQL সেটআপ

### ধাপ ১: PostgreSQL ইনস্টলেশন
1. [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) থেকে PostgreSQL 16 বা 15 ইনস্টলার ডাউনলোড করে ইনস্টল করুন।
2. ইনস্টলেশনের সময় ডিফল্ট ইউজার `postgres`, পোর্ট `5432` এবং একটি সহজ পাসওয়ার্ড দিন (যেমন: `postgres`)।

### ধাপ ২: ডেটাবেজ তৈরি
PowerShell বা Command Prompt খুলে নিচের কমান্ড দিন:
```powershell
createdb -U postgres smarterp_db
```
*(অথবা pgAdmin সফটওয়্যার খুলে `Databases` এর উপর রাইট-ক্লিক করে `Create > Database...` থেকে নাম দিন `smarterp_db`)*

### ধাপ ৩: পরিবেশ কনফিগারেশন (.env)
প্রজেক্ট রুটের `.env` ফাইলে আপনার ডেটাবেজ কানেকশন স্ট্রিং ঠিক আছে কিনা দেখে নিন:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smarterp_db"
```

---

## ২. একযোগে ফ্রন্টএন্ড ও ব্যাকএন্ড চালনা

SmartERP-তে ফ্রন্টএন্ড এবং ব্যাকএন্ড উভয়েই একই সাথে চালু করার জন্য তৈরি করা হয়েছে ইউনিফাইড ডেভ রানার।

টার্মিনালে শুধু রান করুন:
```bash
npm run dev
```

এটি চালু হলে:
- 🌐 **Frontend UI:** `http://localhost:5173`
- 🔌 **Backend API Gateway:** `http://localhost:5000/api/v1`
- 🩺 **Health Check:** `http://localhost:5000/health`

### ডেটাবেজ মাইগ্রেশন ও সিডিং:
- **UI থেকে:** ব্রাউজারে অ্যাপ ওপেন করে **Global Settings ➔ PostgreSQL** ট্যাবে যান এবং **"🛠️ মাইগ্রেশন চালান"** ও **"🌱 প্রাথমিক ডেটা সিড করুন"** বাটনে ক্লিক করুন।
- **CLI থেকে:** টার্মিনালে কমান্ড দিন:
```bash
npm run setup:db
```

---

## ৩. রিয়েল সার্ভারে ডিপ্লয়মেন্ট: পদ্ধতি ১ - Docker Compose

যেকোনো ক্লাউড সার্ভার (DigitalOcean, AWS EC2, Hetzner, Linode, বা লোকাল Linux সার্ভার)-এ সবচেয়ে সহজ ও দ্রুততম উপায়।

### ধাপসমূহ:
1. সার্ভারে ডকার ইনস্টল করুন (যদি না থাকে):
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-v2
   ```
2. SmartERP ফোল্ডারটি সার্ভারে কপি করুন।
3. ফোল্ডারের ভেতরে ঢুকে কমান্ড দিন:
   ```bash
   docker compose up -d --build
   ```
4. এটি স্বয়ংক্রিয়ভাবে:
   - PostgreSQL 16 alpine কন্টেইনার তৈরি ও রান করবে।
   - SmartERP অপ্টিমাইজড মাল্টি-স্টেজ নোড প্রোডাকশন বিল্ড তৈরি করবে।
   - পোর্ট `5000`-এ অ্যাপ্লিকেশন লাইভ করবে।
5. সার্ভার স্ট্যাটাস দেখতে:
   ```bash
   docker compose ps
   docker compose logs -f app
   ```

---

## ৪. রিয়েল সার্ভারে ডিপ্লয়মেন্ট: পদ্ধতি ২ - Native Ubuntu/Debian (PM2 + Nginx)

### ধাপ ১: সার্ভার ডিপেন্ডেন্সি ইনস্টল
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm postgresql postgresql-contrib nginx
sudo npm install -g pm2
```
*(Node.js v20+ নিশ্চিত করুন: `node -v`)*

### ধাপ ২: সার্ভার PostgreSQL কনফিগারেশন
```bash
sudo -u postgres psql
```
PostgreSQL শেলের ভেতরে রান করুন:
```sql
CREATE DATABASE smarterp_db;
CREATE USER smarterp_admin WITH ENCRYPTED PASSWORD 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE smarterp_db TO smarterp_admin;
ALTER DATABASE smarterp_db OWNER TO smarterp_admin;
\q
```

### ধাপ ৩: প্রজেক্ট প্রোডাকশন বিল্ড ও রান
প্রজেক্ট ফোল্ডারে:
```bash
# ১. ডিপেন্ডেন্সি ইনস্টল
npm ci

# ২. প্রোডাকশন .env প্রস্তুত
cp .env.production.example .env
nano .env # (আপনার ডেটাবেজ পাসওয়ার্ড বসিয়ে সেভ করুন: Ctrl+O, Enter, Ctrl+X)

# ৩. সম্পূর্ণ প্রোডাকশন বান্ডেল বিল্ড করুন
npm run build

# ৪. ডেটাবেজ মাইগ্রেশন ও প্রাথমিক সিড চালান
npm run setup:db

# ৫. PM2 দিয়ে ব্যাকগ্রাউন্ডে চালু করুন
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### ধাপ ৪: Nginx রিভার্স প্রক্সি ও ডোমেইন কানেক্ট
```bash
sudo cp nginx-smarterp.conf /etc/nginx/sites-available/smarterp
sudo nano /etc/nginx/sites-available/smarterp # (server_name এ আপনার ডোমেইন বা আইপি দিন)
sudo ln -s /etc/nginx/sites-available/smarterp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### ধাপ ৫: ফ্রি SSL (HTTPS) সক্রিয়করণ (ঐচ্ছিক কিন্তু বাঞ্ছনীয়)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## ৫. নিরাপত্তা ও সম্পূর্ণ অফলাইন ডিপ্লয়মেন্ট

আপনার নির্দেশনা অনুযায়ী **কোনো গিটহাব পুশ বা পাবলিশ করা যাবে না**:
- `.github/workflows/deploy.yml` স্থায়ীভাবে মুছে ফেলা হয়েছে।
- `gh-pages` সম্পর্কিত স্ক্রিপ্ট ও ডিপেন্ডেন্সি সরানো হয়েছে।
- `.gitignore` ফাইলে `.env`, `.env.production` এবং ডাটাবেজ ডাম্প ফাইলগুলো সুরক্ষিত।

### সার্ভারে সরাসরি ফাইল ট্রান্সফার করার উপায়:
**বিকল্প ১: SCP / Rsync (SSH)**
```bash
# আপনার কম্পিউটার থেকে সার্ভারে জিপ বা ফাইল পাঠাতে:
rsync -avz --exclude 'node_modules' --exclude '.git' ./ user@your-server-ip:/var/www/smarterp/
```

**বিকল্প ২: Zip ফাইল বানিয়ে ট্রান্সফার**
1. লোকাল ফোল্ডার থেকে `node_modules` বাদে জিপ করুন।
2. FileZilla বা WinSCP দিয়ে সার্ভারে আপলোড করুন।
3. সার্ভারে `unzip smarterp.zip` করে `npm install` ও `npm run build` দিন।

---

## ৬. PostgreSQL ব্যাকআপ ও রিস্টোর

### সম্পূর্ণ ডেটাবেজ ব্যাকআপ (Export):
```bash
pg_dump -U smarterp_admin -d smarterp_db -F c -b -v -f "smarterp_backup_$(date +%F).dump"
```

### ব্যাকআপ রিস্টোর (Import):
```bash
pg_restore -U smarterp_admin -d smarterp_db -v "smarterp_backup_YYYY-MM-DD.dump"
```
*(উইন্ডোজে pgAdmin থেকেও খুব সহজে Tools ➔ Backup / Restore ব্যবহার করা যায়)*
