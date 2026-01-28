# Profound - Food Delivery Platform for Hualien

## Project Architecture

This is a **Next.js 15** + **Supabase** food delivery platform connecting Hualien city to Zhixue area. The app uses **HeroUI** components with **Tailwind CSS** and traditional Chinese interface.

### Core Business Logic

- **Store Management**: Automated deadline-based store closing via cron jobs
- **Order Limits**: Dual-layer limits (global + per-store daily maximums)
- **Pricing**: Fixed dev fee (10 TWD) + tiered shipping (20 TWD if <150, else 12% of cost)

### Key Data Flow

```
Customer Order → Store Validation → Order Limits Check → Price Calculation → Supabase Insert → Cron Cleanup
```

## Authentication & Authorization

- **Middleware**: `middleware.ts` protects `/admin/*` routes, redirects unauthenticated users
- **RLS Policies**: Public can create orders and lookup by pickup code, authenticated users manage everything
- **Admin Access**: All admin features require Supabase authentication

## Database Schema (Supabase)

### Core Tables

- `stores`: `is_open`, `order_deadline`, `max_daily_orders`
- `orders`: Complete delivery info with pickup codes, pricing breakdown, dual status tracking
- `global_settings`: System-wide configs like `max_daily_orders`

### Critical Business Rules

- Store auto-closure when `order_deadline` passes (via `validateStore.ts`)
- Orders no longer have pickup time, as it will be announced in community channels

## Component Architecture

### Form System (`components/order-form/`)

- **Multi-step**: Store selection → Order details
- **Validation**: Real-time via `utils/validation.ts`
- **Hooks Pattern**: `useStores`, `useImageUpload`, `useOrderSubmit`
- **Constants**: Pickup locations in `constants.ts`

### Admin System (`components/admin/`)

- **Modular**: Each admin feature in separate directories
- **Real-time**: Status updates trigger data refetch
- **Dual Views**: Table and card layouts for orders

## Key Utilities & Libraries

### Business Logic (`lib/`)

- `checkOrderLimits.ts`: Validates daily order caps (global + store-level)
- `validateStore.ts`: Handles automated store closure and validation
- `supabase/`: Separate client/server instances for proper SSR

### Styling (`components/primitives.ts`)

- **HeroUI + Tailwind Variants**: Use `tv()` from `tailwind-variants`
- **Design System**: Color-coded status chips, gradient titles
- **Responsive**: Mobile-first grid layouts

## Development Patterns

### File Organization

- **Co-location**: Components with their hooks/utils in same directory
- **TypeScript**: Strict typing with interfaces in `types/index.ts`
- **API Routes**: Minimal, mainly for cron endpoints

### State Management

- **Local State**: useState for forms and UI state
- **Server State**: Direct Supabase queries, no additional cache layer
- **Error Handling**: Try-catch with user-friendly messages

### Data Fetching

- **Server Components**: For initial data loading
- **Client Components**: For interactive features with `"use client"`
- **Real-time**: Manual refetch after mutations, no subscriptions

## Critical Configuration

### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`: For admin operations (cleanup jobs)
- `CRON_SECRET`: Protects automated cron endpoints

### GitHub Actions Secrets

- `CRON_SECRET`: Same as environment variable
- `APP_URL`: Production URL (e.g., https://your-app.vercel.app)

### Development Commands

- `npm run dev --turbopack`: Development with Turbo bundler
- `npm run lint`: ESLint with custom config
- No test setup currently configured

## Integration Points

### Supabase Storage

- Order images uploaded to `orders` bucket
- Public URLs generated for menu photos
- Error graceful (order succeeds even if upload fails)

### Cron Jobs

- `GET /api/cron/close-stores`: Automated store deadline enforcement
- `GET /api/cron/cleanup-images`: Preview old order images to cleanup
- `POST /api/cron/cleanup-images`: Execute cleanup of old order images (default: 30 days)
- All cron endpoints require `Authorization: Bearer {CRON_SECRET}` header
- GitHub Actions workflow runs weekly cleanup on Sundays 3:00 AM (UTC+8)

## Common Patterns

### Error Handling

```tsx
try {
  const { data, error } = await supabase.from("table").select();
  if (error) throw error;
} catch (err) {
  console.error("Operation failed:", err);
  // User-friendly fallback
}
```

### Modal Patterns

```tsx
const { isOpen, onOpen, onOpenChange } = useDisclosure();
// Always use onOpenChange for HeroUI modal state
```

### Form Validation

- Real-time validation on input change
- Separate error state object for each field
- Clear errors when user starts typing

## Deployment Notes

- **Static Export**: No server runtime dependencies
- **Supabase RLS**: All data security handled at database level
- **Image Storage**: Public bucket with cache control headers
- **Cron**: External service needed for automated store closure

## Disaster Recovery

### Google Sheets Order Sync

When Supabase is unavailable, orders are backed up to Google Sheets for emergency access.

- **Edge Function**: `supabase/functions/sync-to-sheets/` - Syncs new orders to Google Sheets
- **Trigger**: Database Webhook on `orders` table INSERT events
- **Setup Guide**: See `docs/google-sheets-sync-setup.md`
- **Synced Fields**: order_time, store_name, pickup info, costs, status, notes
