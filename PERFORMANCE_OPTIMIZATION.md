# Performance Optimization Guide

## Current Issues Fixed ✅

### 1. API Route Optimization (`/api/forms/all`)
- ✅ Removed double client creation (was creating both admin and auth clients)
- ✅ Changed from `SELECT *` to selective field fetching
- ✅ Added response caching headers (30s cache, 60s stale-while-revalidate)

**Impact:** Should reduce response time from ~1100ms to ~300-500ms

---

## Additional Optimizations to Implement

### 2. Add Database Indexes (High Priority) 🔥

Your queries use `ORDER BY created_at DESC`, but you may not have an index on this column.

**Run this SQL in your Supabase SQL Editor:**

```sql
-- Add index for forms table
CREATE INDEX IF NOT EXISTS idx_forms_created_at ON forms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forms_is_active ON forms(is_active);
CREATE INDEX IF NOT EXISTS idx_forms_priority_level ON forms(priority_level);
CREATE INDEX IF NOT EXISTS idx_forms_label ON forms(label);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_forms_active_created ON forms(is_active, created_at DESC);
```

**Expected Impact:** 50-80% faster queries

---

### 3. Server-Side Filtering (Recommended)

Currently, ALL filtering happens on the client after fetching all data. Move filters to the API route:

**Create:** `/app/api/forms/all/route.ts`

Add query parameters support:

```typescript
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    
    let query = supabase
        .from('forms')
        .select('form_id, title, description, label, time_to_complete, priority_level, version, is_active, created_at, updated_at')
        .order('created_at', { ascending: false });
    
    if (status === 'active') query = query.eq('is_active', true);
    if (status === 'inactive') query = query.eq('is_active', false);
    if (priority) query = query.eq('priority_level', priority);
    if (category) query = query.eq('label', category);
    
    const { data, error } = await query;
    // ...
}
```

---

### 4. Implement Client-Side Caching

Use SWR or React Query for automatic caching and revalidation:

```bash
bun add swr
```

**Update:** `/app/(admin)/admin/manage-forms/page.tsx`

```tsx
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ManageFormsPage() {
    const { data: forms, error, mutate } = useSWR<Form[]>(
        '/api/forms/all',
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 60000, // 1 minute
        }
    );
    
    const isLoading = !forms && !error;
    // ...
}
```

**Benefits:**
- Automatic caching
- No refetch on component remount
- Optimistic updates
- Background revalidation

---

### 5. Add Loading States with Suspense

Implement streaming for faster perceived performance:

```tsx
// app/(admin)/admin/manage-forms/page.tsx
import { Suspense } from 'react';

export default function ManageFormsPage() {
    return (
        <Suspense fallback={<FormsLoadingSkeleton />}>
            <FormsContent />
        </Suspense>
    );
}
```

---

### 6. Optimize RLS Policies

Check your Row Level Security policies in Supabase. Complex RLS policies can slow down queries significantly.

**Check current policies:**

```sql
SELECT * FROM pg_policies WHERE tablename = 'forms';
```

**Consider:**
- Using simpler conditions
- Adding indexes on columns used in RLS policies
- Using `security_invoker` functions if applicable

---

### 7. Enable Supabase Postgres Read Replicas (Production)

For production, consider using Supabase's read replicas for queries:

```typescript
const supabase = createClient({
    db: {
        schema: 'public',
    },
    global: {
        headers: { 'x-supabase-read-replica': 'enabled' },
    },
});
```

---

## Performance Monitoring

### Add Performance Tracking

```typescript
// utils/performance.ts
export function measurePerformance(label: string) {
    const start = performance.now();
    return () => {
        const end = performance.now();
        console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
    };
}

// Usage in API route
const stopTimer = measurePerformance('Fetch Forms');
const { data } = await supabase.from('forms').select('*');
stopTimer();
```

---

## Quick Wins Summary

**Immediate Actions (Already Implemented):**
1. ✅ Fixed double client creation
2. ✅ Added selective field fetching
3. ✅ Added response caching

**Next Steps (High Impact):**
1. 🔥 **Add database indexes** (Run the SQL above) - 5 minutes
2. 📦 **Install SWR for client caching** - 10 minutes
3. 🎯 **Add server-side filtering** - 20 minutes

**Expected Results:**
- Current: ~1100ms
- After indexes: ~300-400ms
- After all optimizations: ~150-250ms

---

## Testing Performance

```bash
# Test API endpoint speed
time curl http://localhost:3000/api/forms/all

# Or use this in browser console
console.time('API Call');
fetch('/api/forms/all').then(() => console.timeEnd('API Call'));
```
