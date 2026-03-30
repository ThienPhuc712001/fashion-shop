# 🚀 Deployment Guide

## 📦 Options

### 1. Docker (Recommended)

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### 2. PM2 on VPS

```bash
# Install dependencies
npm ci --only=production

# Build
npm run build

# Start with PM2
pm2 start dist/server.js --name fashion-shop

# Save PM2 config
pm2 save
pm2 startup
```

### 3. Railway / Render

- Connect GitHub repo
- Set build command: `npm run build`
- Set start command: `npm start`
- Add environment variables
- Add persistent volume for `data/` and `uploads/`

## ⚙️ Environment Variables

See `.env.example`. Minimum required:

- `JWT_SECRET` (generate with: `openssl rand -base64 32`)
- Database path (default: `./data/fashion_shop.db`)
- Payment configs (optional)

## 🔐 Security Checklist

- [ ] Change JWT_SECRET to strong random string
- [ ] Set strong admin password (use seed then update)
- [ ] Configure CORS_ORIGIN to your frontend domain
- [ ] Enable HTTPS (use reverse proxy nginx/Traefik)
- [ ] Set up firewall (allow only 80/443)
- [ ] Regularly backup `data/` folder
- [ ] Keep dependencies updated (`npm audit`)

## 📁 Folder Structure after Deploy

```
/app
├── dist/           # Compiled JavaScript
├── src/            # Source (optional in production)
├── data/           # SQLite database (persistent volume)
├── uploads/        # Uploaded images (persistent volume)
├── logs/           # Request logs (optional)
└── .env            # Environment variables
```

## 🔄 Database Migrations

If you need to modify schema:

1. Update `src/config/database.ts`
2. Recreate database (dev) or write migration SQL script
3. For production, use `sqlite3 data/fashion_shop.db < migration.sql`

## 📊 Monitoring

- Health endpoint: `GET /health`
- API info: `GET /api`
- Consider adding Prometheus metrics or uptime monitor

## 🧹 Maintenance

- Log rotation: Configure `winston` to rotate logs daily
- Database backup: `cp data/fashion_shop.db backup_$(date +%F).db`
- Cleanup old uploads: The system doesn't auto-clean; implement periodic cleanup.

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | Change `PORT` or kill process on port 3000 |
| Database locked | Ensure no other process using DB; use WAL mode |
| Sharp errors | Reinstall with `npm rebuild sharp` |
| Payment not working | Check env vars and sandbox credentials |

---

Need help? Check README.md or open an issue.
