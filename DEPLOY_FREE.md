# 🚀 Production Deployment Guide (Free Tier)

## 🎯 Architecture

```
Vercel (Frontend)  ←→  Railway (Backend + SQLite)
      |                     |
   *.vercel.app       *.railway.app
```

- **Frontend**: Next.js hosted on Vercel (free)
- **Backend**: Express.js on Railway (free tier, 512MB RAM, sleeps after 30 days inactivity)
- **Database**: SQLite file stored in Railway persistent volume
- **Domain**: Free subdomains from Vercel & Railway

---

## 📋 Prerequisites

1. **GitHub account** (required)
2. **Vercel account** (free, sign up with GitHub)
3. **Railway account** (free, sign up with GitHub)
4. **Git** installed locally

---

## 🛠️ Step 1: Push Code to GitHub

```bash
cd D:\.openclaw\workspace\fashion-shop

# Initialize git if not already
git init
git add .
git commit -m "Initial commit - Production ready"

# Create new repo on GitHub (https://github.com/new)
# Name: fashion-shop (or your choice)
# Copy remote URL: https://github.com/yourusername/fashion-shop.git

git remote add origin https://github.com/yourusername/fashion-shop.git
git branch -M main
git push -u origin main
```

---

## 🌐 Step 2: Deploy Backend to Railway

1. Go to [Railway.app](https://railway.app) → Login with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `fashion-shop` repository
4. Configuration:
   - **Root Directory**: `/` (leave empty)
   - **Build Command**: `npm run build`
   - **Start Command**: `node dist/server.js`
   - **Environment**: `NODE_ENV=production`
5. **Add Persistent Volume** (for SQLite DB):
   - Go to your project → **"Volumes"** tab
   - Click **"Create Volume"**
   - Name: `data`
   - Mount path: `/app/data`
   - Size: 1GB (free)
6. **Set Environment Variables**:
   - `PORT=3001`
   - `JWT_SECRET=generate-a-strong-random-string`
   - `DB_PATH=/app/data/fashion_shop.db`
   - `CORS_ORIGIN=https://*.vercel.app`
   - (Optional) Payment configs, etc.
7. Click **"Deploy"**
8. Wait for build (~2-3 min)
9. After deploy, copy your Railway domain: `https://fashion-shop-backend.railway.app`

---

## 🌐 Step 3: Deploy Frontend to Vercel

1. Go to [Vercel.com](https://vercel.com) → Login with GitHub
2. Click **"New Project"** → Import your `fashion-shop` repo
3. Configuration:
   - **Root Directory**: `/` (leave empty)
   - **Build Command**: `npm run build:frontend`
   - **Output Directory**: `.next` (auto-detected)
4. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`
     (replace with your actual Railway domain)
   - `NODE_ENV=production`
5. Click **"Deploy"**
6. Wait for build (~2-3 min)
7. After deploy, copy your Vercel domain: `https://fashion-shop.vercel.app`

---

## 🔗 Step 4: Update Vercel API URL

1. In Vercel dashboard, go to your project → **"Environment Variables"**
2. Update `NEXT_PUBLIC_API_URL` to match your Railway backend URL
3. Redeploy (Vercel automatically redeploys on env var change)

---

## 🔧 Step 5: Configure Backend CORS

In Railway backend environment, ensure `CORS_ORIGIN` includes your Vercel domain:

```
CORS_ORIGIN=https://your-app.vercel.app,http://localhost:3000
```

If you haven't set this during deploy, add it in Railway → Project → **"Variables"** and redeploy.

---

## ✅ Step 6: Test Production

1. **Frontend**: Open `https://your-app.vercel.app`
   - Should load without errors
   - Products page should display items from backend
2. **Admin Panel**: `https://your-app.vercel.app/admin`
   - Login: `admin@fashionshop.com` / `admin123`
   - Test CRUD operations
3. **Checkout**: Add items, create order
4. **Backend Health**: `https://your-backend.railway.app/health`

---

## 🔄 Database Seeding

First time setup: In Railway, run seed script to populate database:

```bash
# In Railway console (Project → Console)
npm run seed
```

Or add a one-time deploy script to run `seed.ts` before starting server.

---

## ⚠️ Important Notes

### Railway Free Tier Limitations:
- Sleeps after 30 days of inactivity
- 512MB RAM, 1GB storage (volume)
- Shared CPU, may be slow on first request after wake

### SQLite on Railway:
- Database stored in `/app/data/fashion_shop.db` (persistent volume)
- Backups: Download volume file periodically
- For production with high traffic, consider upgrading to Railway's managed PostgreSQL

### Domain:
- Railway provides `*.railway.app` subdomain (free)
- Vercel provides `*.vercel.app` subdomain (free)
- You can connect custom domain later (requires upgrade)

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend returns 500 on Vercel | Check Railway logs → CORS misconfiguration |
| Database not found | Ensure volume mounted at `/app/data` and `DB_PATH` set |
| Static assets not loading | Check Vercel build logs → `.next` folder exists |
| Slow first load | Railway free tier sleeps → first request wakes it (30-60s) |

---

## 📞 Support

If you encounter issues:
1. Check Railway logs: `railway logs`
2. Check Vercel logs: in project → "Deployments" → view logs
3. Verify environment variables are set correctly
4. Test backend directly: `https://your-backend.railway.app/api/products`

---

**Good luck with your deployment!** 🚀
