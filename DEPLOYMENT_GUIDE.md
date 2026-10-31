# 🚀 Complete Deployment Guide — MEMOPIX (Frontend + Backend)

Deploying **MEMOPIX** to free, global production hosting takes under **5 minutes**.

---

## 🏗️ Architecture Overview

| Component | Technology | Best Free Hosting | Why |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS | **Vercel** | Free global CDN, automatic SSL, instant preview links, git auto-deploys. |
| **Backend API** | Node.js, Express, Prisma ORM | **Render** or **Railway** | Free persistent web service, custom domains, automated health checks. |

---

## ⚡ STEP 1: Deploy Backend to Render (Free)

1. Go to **[https://render.com](https://render.com)** and sign up / log in with your GitHub account.
2. Click **"New +"** → **"Web Service"**.
3. Choose **"Build and deploy from a Git repository"** and select **`SuchithKumar2007/Cloud_Storage`**.
4. Configure the Web Service settings:
   * **Name**: `memopix-backend` (or any name you like)
   * **Root Directory**: `backend`
   * **Environment**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   | Key | Value | Note |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `10000` | Render default port |
   | `DATABASE_URL` | `file:./dev.db` | Or Supabase/PostgreSQL connection string |
   | `JWT_SECRET` | `memopix_super_secret_jwt_key_5tb_production_2026_x89a7f3` | Any 32+ char secret string |
   | `STORAGE_LIMIT_BYTES` | `5000000000000` | 5 TB quota limit |
   | `STORAGE_DRIVER` | `local` | Or `supabase` / `s3` |
6. Click **"Create Web Service"**.
7. In ~2 minutes, Render will provide your public backend URL:
   👉 **`https://memopix-backend.onrender.com`**

---

## ⚡ STEP 2: Deploy Frontend to Vercel (Free)

1. Go to **[https://vercel.com/new](https://vercel.com/new)** and sign in with GitHub.
2. Under **Import Git Repository**, find **`SuchithKumar2007/Cloud_Storage`** and click **"Import"**.
3. In the project setup screen:
   * **Framework Preset**: `Vite`
   * **Root Directory**: Click *Edit* and select **`frontend`**
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://memopix-backend.onrender.com` *(paste your backend URL from Step 1)* |
5. Click **"Deploy"**.
6. In ~30 seconds, Vercel will give your live frontend URL:
   👉 **`https://memopix-5tb.vercel.app`**

---

## ⚡ STEP 3: Link Backend to Frontend (CORS)

Once you have your Vercel frontend URL (e.g. `https://memopix-5tb.vercel.app`):
1. Go to your **Render Dashboard** → `memopix-backend` → **Environment**.
2. Add / update this variable:
   * **`FRONTEND_URL`**: `https://memopix-5tb.vercel.app`
3. Click **Save Changes** (Render will auto-redeploy).

---

## 🎉 That's It! Your Full-Stack 5 TB Cloud App is Live!

* Users can register, log in with Google, upload high-res photos and 4K videos, create albums, generate secure share links, and use their **5 TB private cloud storage** from any device anywhere in the world!
