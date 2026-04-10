# 🚀 ZedBeatz Vercel Deployment Guide

## Prerequisites:
- Vercel account (free)
- Vercel CLI installed ✅

## Step 1: Login to Vercel

```bash
cd ~/projects/zedbeatz
vercel login
```

## Step 2: Deploy

```bash
vercel --prod
```

## Step 3: Add Environment Variables

After deployment, add these in Vercel Dashboard:

### Go to: https://vercel.com/your-project/settings/environment-variables

**Add these variables:**

```
NEXT_PUBLIC_SUPABASE_URL=https://rnllteddxhdyjknspvqy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJubGx0ZWRkeGhkeWprbnNwdnF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzAxMjIsImV4cCI6MjA5MDYwNjEyMn0.KADrujxYsFGLwRggggAF8KjafAdxTzwO-VgOX12KBo0

R2_ACCOUNT_ID=580289486be253af98dc84ab2653ffab
R2_ACCESS_KEY_ID=7805e79d9e2b908689c7d41e0d01de17
R2_SECRET_ACCESS_KEY=c3cd5d60db0392c1e5f46883df1f3bbeff14be061985c719f707971477b3e503
R2_BUCKET_NAME=zedbeatz
R2_PUBLIC_URL=https://pub-9c5128d5b09c4ce4b74a5e0d3d7fa779.r2.dev

NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-9c5128d5b09c4ce4b74a5e0d3d7fa779.r2.dev
```

**Important:** Mark all `R2_*` variables (except `R2_PUBLIC_URL`) as **Server-only** (not exposed to browser)

## Step 4: Redeploy

After adding environment variables:

```bash
vercel --prod
```

## Step 5: Update Agent

Once deployed, update agent's `.env`:

```bash
# Replace with your Vercel URL
ZEDBEATZ_API_URL=https://your-project.vercel.app
```

Then redeploy agent:

```bash
cd ~/projects/agent
fly deploy
```

## Step 6: Test

1. Visit your Vercel URL
2. Test playing a song
3. Test admin upload from agent

---

## Quick Deploy (One Command):

```bash
cd ~/projects/zedbeatz && vercel --prod
```

Then add environment variables in Vercel dashboard and redeploy.

---

## Troubleshooting:

### Build fails:
```bash
# Test build locally first
npm run build
```

### Environment variables not working:
- Make sure they're added in Vercel dashboard
- Redeploy after adding variables
- Check variable names match exactly

### API routes not working:
- Vercel automatically handles Next.js API routes
- No additional config needed

### R2 uploads fail:
- Check R2 credentials are correct
- Make sure R2_* variables are server-only
- Check CORS settings in R2 bucket

---

## Your Vercel URL will be:

```
https://zedbeatz.vercel.app
```

Or custom domain if you add one later.

---

**Ready to deploy? Run:**

```bash
cd ~/projects/zedbeatz
vercel --prod
```
