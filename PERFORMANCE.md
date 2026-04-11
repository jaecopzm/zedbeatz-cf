# Performance Optimization Guide

## ✅ Implemented

1. **Font Loading** - Added `display: swap` to prevent font blocking
2. **Compression** - Enabled gzip compression in Next.js config
3. **Image Optimization** - Disabled (avoiding Vercel costs)
4. **Caching** - Already using `unstable_cache` with revalidation times

## 🚀 Quick Wins (Do These Now)

### 1. Replace Next/Image with regular img tags
Since you disabled image optimization, remove unused Next/Image imports:
```bash
# Find all files still importing Next/Image
grep -r "import Image from \"next/image\"" --include="*.tsx" --include="*.ts"
```

### 2. Add loading="lazy" to images
Update all `<img>` tags to include lazy loading:
```tsx
<img src={url} alt={alt} loading="lazy" />
```

### 3. Reduce initial data fetching
Current home page fetches 5 datasets. Consider:
- Load playlists on scroll (not initially)
- Reduce featured artists from 8 to 6
- Load trending section lazily

### 4. Code splitting for heavy libraries
Lazy load framer-motion animations:
```tsx
// Instead of:
import { motion } from "framer-motion"

// Use:
const motion = dynamic(() => import("framer-motion").then(m => ({ default: m.motion })))
```

## 🎯 Medium Impact

### 5. Optimize Clerk loading
Add `appearance` prop to reduce Clerk bundle:
```tsx
<ClerkProvider appearance={{ layout: { unsafe_disableDevelopmentModeWarnings: true } }}>
```

### 6. Reduce Google Analytics impact
Already using `strategy="afterInteractive"` ✓

### 7. Add resource hints
```tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="dns-prefetch" href="https://cdn.zedbeatz.com" />
```

### 8. Optimize Supabase queries
- Add indexes on frequently queried columns (plays, created_at)
- Use `.select()` to only fetch needed columns
- Consider edge functions for complex queries

## 📊 Monitoring

### Measure improvements:
```bash
# Build and analyze bundle
npm run build

# Check bundle size
npx @next/bundle-analyzer
```

### Lighthouse scores to track:
- First Contentful Paint (FCP) - Target: < 1.8s
- Largest Contentful Paint (LCP) - Target: < 2.5s
- Time to Interactive (TTI) - Target: < 3.8s
- Total Blocking Time (TBT) - Target: < 200ms

## 🔧 Advanced Optimizations

### 9. Static Generation where possible
Convert pages that don't need real-time data to SSG:
```tsx
export const revalidate = 3600; // Revalidate every hour
```

### 10. Implement ISR (Incremental Static Regeneration)
For artist/track pages:
```tsx
export const revalidate = 300; // 5 minutes
```

### 11. Add Service Worker for offline support
Use next-pwa for caching static assets

### 12. Optimize CSS
- Remove unused Tailwind classes (already tree-shaken)
- Consider critical CSS extraction

### 13. Database optimizations
```sql
-- Add indexes
CREATE INDEX idx_tracks_created_at ON tracks(created_at DESC);
CREATE INDEX idx_tracks_plays ON tracks(plays DESC);
CREATE INDEX idx_tracks_artist_id ON tracks(artist_id);
```

## 🎨 User Experience

### 14. Add loading skeletons
Already have `TrackCardSkeleton` ✓

### 15. Prefetch on hover
```tsx
<Link href={url} prefetch={true}>
```

### 16. Optimize mobile experience
- Reduce animations on mobile
- Smaller images for mobile viewports
- Defer non-critical JS

## 📦 Bundle Size Reduction

Current heavy dependencies:
- framer-motion (~60KB)
- recharts (~100KB) - only used in admin
- embla-carousel (~20KB)

Consider:
- Lazy load admin components
- Replace framer-motion with CSS animations where possible
- Use dynamic imports for charts
