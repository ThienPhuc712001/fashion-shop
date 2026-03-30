# Copy Files to Desktop

## Files Changed

These files need to be copied to your desktop project:

```
C:\Users\cntt.tts13\OneDrive - AnPhatHoldings\Desktop\employee-management\
```

### 1. seed.ts (NEW FILE)
**Location in workspace:** `D:\.openclaw\workspace\fashion-shop\seed.ts`
**Action:** Copy this new file to the desktop folder
**Purpose:** Database seeder - creates admin user, categories, brands, sample product

**Important:** The import uses `./src/config/database` which expects the project structure:
```
fashion-shop/
├── seed.ts
├── src/
│   └── config/
│       └── database.ts
└── package.json
```
Make sure the `src` folder is at the same level as `seed.ts`.

### 2. tsconfig.build.json (MODIFIED)
**Location in workspace:** `D:\.openclaw\workspace\fashion-shop\tsconfig.build.json`
**Action:** Overwrite the existing file on desktop with this version
**Key change:** Added `"seed.ts"` to the `include` array so the seed file gets compiled during build

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "noEmitOnError": false,
    "outDir": "./dist",
    "module": "commonjs",
    "moduleResolution": "node",
    "jsx": "react-jsx"
  },
  "include": ["src/**/*.ts", "src/**/*.js", "seed.ts"],  // <-- Added seed.ts here
  "exclude": ["node_modules", "tests", "**/*.test.ts", "**/*.spec.ts"]
}
```

## What Was Fixed

1. **Missing seed.ts** - The file was deleted/lost, recreated with proper database seeder
2. **Build error** - `seed.route.ts` imports `seedDatabase` from `../seed`, but seed.ts didn't exist
3. **Database API** - Changed from `db.query()` to `db.run()`/`db.get()`/`db.all()` to match Database class
4. **Schema alignment** - Fixed column names: `password` → `password_hash`, `price_modifier` → `price_adjustment`, `image_url` → `url`
5. **UUIDs** - All tables now get proper UUID primary keys

## After Copying

Run these commands in the desktop folder:

```bash
# Install dependencies (if not done)
npm install

# Test build
npm run build

# Seed database
npx ts-node seed.ts

# Start server
npm start
```

## Verification

- Build should complete without errors
- Seed should create admin user: `admin@fashionshop.com` / `admin123`
- Database file will be created at `data/fashion_shop.db`
