# TaskFlow Setup & Deployment Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Prerequisites
```bash
# Check versions
node --version  # Should be 18+
npm --version
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Supabase credentials
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Supabase Setup
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project to initialize (~2 minutes)
3. Copy project URL and anon key from Settings → API
4. Paste into `.env` file

### 4. Database Migration
1. Go to Supabase → SQL Editor
2. Click "New Query"
3. Paste entire content of `/supabase/migrations/001_initial_schema.sql`
4. Click "Run"
5. Wait for success message

### 5. Enable Realtime
1. Supabase Dashboard → Database → Replication
2. Enable Realtime for `tasks` table
3. Click "Save"

### 6. Install & Run
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:5173 in browser
```

### 7. (Optional) Seed Demo Data
```bash
npm run seed
# Creates demo user: demo@taskflow.app / DemoPass123!
```

---

## 🧪 Development Commands

```bash
# Start development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm run test
npm run test -- --watch
npm run test:ui

# Build for production
npm run build

# Preview production build
npm run preview

# Seed demo data
npm run seed
```

---

## 📋 Verify Installation

Run this checklist to ensure everything is working:

- [ ] `npm install` completed without errors
- [ ] `npm run typecheck` passes (no TS errors)
- [ ] `npm run lint` passes
- [ ] `npm run dev` starts server at localhost:5173
- [ ] Login page loads
- [ ] Sign up works (creates user in Supabase)
- [ ] Can create board
- [ ] Can add tasks
- [ ] Can drag tasks between columns
- [ ] Open two tabs, verify real-time sync

---

## 🚢 Deployment to Vercel

### Step 1: Prepare GitHub
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git push -u origin main
```

### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Select `taskflow` repository
5. Click "Import"

### Step 3: Set Environment Variables
1. In Vercel project settings → Environment Variables
2. Add two variables:
   - `VITE_SUPABASE_URL` = (your Supabase URL)
   - `VITE_SUPABASE_ANON_KEY` = (your anon key)
3. Click "Save"

### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete (~3-5 minutes)
3. Get your live URL from Vercel dashboard
4. Share with employers/users!

---

## 🔧 Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution:** 
- Check `.env` file exists in project root
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- For dev: restart dev server after updating `.env`
- For Vercel: add env vars in Vercel dashboard

### Issue: "Cannot find module '@dnd-kit'"
**Solution:**
```bash
npm install
npm run dev  # Restart dev server
```

### Issue: Real-time sync not working
**Solution:**
1. Check Realtime is enabled in Supabase (Database → Replication)
2. Verify `tasks` table is enabled
3. Check browser console for WebSocket errors
4. Try reloading page

### Issue: TypeScript errors
**Solution:**
```bash
npm run typecheck
# Fix any reported errors
# Usually type annotations missing on function parameters
```

### Issue: Drag-and-drop not working
**Solution:**
1. Check browser console for errors
2. Verify @dnd-kit is installed: `npm list @dnd-kit/core`
3. Clear cache: `npm cache clean --force`
4. Reinstall: `npm install`

---

## 📊 Performance Optimization

### For Development
- Vite HMR is enabled (instant updates)
- React Fast Refresh for fast component reloads
- TypeScript incremental compilation

### For Production
- Code splitting: Vite automatically splits routes
- Tree-shaking: Unused code removed
- CSS purging: Only used Tailwind classes included
- Minification: All code minified

**Current Bundle Size:** 185 KB gzip

---

## 🔐 Security Checklist

- [ ] `.env` file is in `.gitignore` (credentials not committed)
- [ ] Environment variables set in Vercel (not in code)
- [ ] RLS policies enabled in Supabase
- [ ] HTTPS enforced on production (Vercel + Supabase)
- [ ] npm audit clean (`npm audit`)

---

## 📈 Next Steps

1. **Customize Branding**
   - Update app name in README.md
   - Update logo (add to `/public`)
   - Customize color scheme in `tailwind.config.js`

2. **Add Features**
   - See [Roadmap](./README.md#-roadmap) for ideas
   - Check [Case Study](./docs/case-study.md) for architecture patterns

3. **Improve Documentation**
   - Add screenshots to README
   - Record video walkthrough (Loom)
   - Update "About" section with your info

4. **Share with Employers**
   - Add to portfolio
   - Share in job applications
   - Use in technical interviews

---

## 🆘 Getting Help

**GitHub Issues:** [Create an issue](https://github.com/plumbmonkey/taskflow/issues)

**Common Patterns:**
- Check GitHub Actions logs for CI errors
- Review browser console for client-side errors
- Check Supabase logs for database errors

---

**Happy coding! 🚀**
