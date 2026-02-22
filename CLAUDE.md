# Development Workflow for MuMu

## CRITICAL: Build and Test Protocol

**After EVERY code change, you MUST:**

1. **Run the build:**
   ```bash
   npm run build
   ```
   - Check for TypeScript errors
   - Check for compilation issues
   - Verify all imports are valid

2. **Run tests (when available):**
   ```bash
   npm test
   ```
   - Run all test suites
   - Verify no regressions

3. **Commit changes:**
   ```bash
   git add .
   git commit -m "descriptive message"
   ```
   - Write clear, descriptive commit messages
   - Commit logical units of work
   - Never skip committing completed work

## Git Initialization

If git is not initialized:
```bash
cd /Users/alexanderbercow/Desktop/MuMu\ Claude/mumu
git init
git add .
git commit -m "Initial commit"
```

## Development Server

Start dev server:
```bash
npm run dev
```

Access at: http://localhost:3000

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Payments:** Stripe
- **Icons:** Phosphor Icons

## Project Structure

- `/app` - Next.js app router pages
- `/components` - React components
- `/lib` - Utilities and shared code
- `/public` - Static assets

## Important Notes

- This project is in DEMO MODE for local testing
- Auth middleware is temporarily disabled
- API routes return mock data
- When Supabase is configured, uncomment the real code sections

## Box Opening Economics

The mystery box system uses randomized buyback prices within these ranges:
- **Common (60%)**: $8-15 buyback (users typically lose $5-12)
- **Uncommon (25%)**: $25-40 buyback (break even or small profit)
- **Rare (10%)**: $50-80 buyback (good profit $30-60)
- **Ultra (5%)**: $150-300 buyback (big win $130-280)

Box price: $19.99

## Collectibles

The platform uses 50 specific collectibles from Pop Mart and Sanrio brands:
- Common: 30 items (Molly, Dimoo, Labubu, Hello Kitty, My Melody, etc.)
- Uncommon: 13 items (Shadow Labubu, Sky Angel Cinnamoroll, etc.)
- Rare: 5 items (Skullpanda series)
- Ultra: 2 items (The Other One Hirono, The Warmth Skullpanda)
