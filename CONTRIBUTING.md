# Contributing to TaskFlow

Thank you for your interest in TaskFlow! This document provides guidelines and information for contributing to the project.

## How I Built This

**Timeline:** 3–4 days (portfolio project)

### Day 1: Foundation
- Scaffolded Vite + React + TypeScript + Tailwind
- Set up Supabase project and database schema
- Implemented auth flows (sign up, login, logout)
- Created auth UI

### Day 2: Core Features
- Built board CRUD operations
- Implemented task CRUD operations
- Created Kanban board UI with 3 columns
- Added task creation/editing modal

### Day 3: Advanced Features
- Integrated @dnd-kit for drag-and-drop
- Implemented Supabase Realtime subscriptions
- Added task search functionality
- Wrote critical tests

### Day 4: Polish & Deployment
- Made responsive design adjustments
- Created seed script with demo data
- Wrote comprehensive documentation
- Deployed to Vercel

## Key Technical Decisions

### Why Supabase?
Supabase provides auth, PostgreSQL, and Realtime in one service, eliminating 30–40% of backend boilerplate. For a portfolio project, this demonstrates pragmatic engineering and modern BaaS patterns.

### Why @dnd-kit?
react-beautiful-dnd is archived. @dnd-kit is actively maintained, more flexible, and better TypeScript support.

### Why React Query?
Simplifies optimistic updates and cache invalidation. Significantly reduces boilerplate compared to Redux + RTK Query.

### Decimal order_index
Allows inserting tasks between others without resequencing the entire column. When dropping between tasks at 1.0 and 2.0, new task gets 1.5.

## Development Setup

```bash
# Install dependencies
npm install

# Set up .env with Supabase credentials
cp .env.example .env
# Edit .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Run migrations (paste migrations/001_initial_schema.sql into Supabase dashboard)

# Seed demo data (optional)
npm run seed

# Start dev server
npm run dev
```

## Running Tests

```bash
# Unit and integration tests
npm run test

# E2E tests
npm run test:e2e

# Watch mode
npm run test -- --watch
```

## Code Quality

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build
```

## Project Structure

```
src/
  components/          # React components (KanbanBoard, TaskCard, etc.)
  hooks/              # Custom hooks (useAuth, useTasks, etc.)
  pages/              # Page components (Login, Boards, Board)
  lib/                # Utilities (supabase.ts)
  types/              # TypeScript type definitions
  App.tsx             # Main app component
  main.tsx            # Entry point
  index.css           # Global styles

supabase/
  migrations/         # Database schema migrations

tests/                # Test files
```

## Contributing Guidelines

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -am 'Add feature'`
3. Run tests and linting: `npm run test && npm run lint`
4. Push to branch: `git push origin feature/your-feature`
5. Create a Pull Request with detailed description

## Performance Targets

- **Page Load:** ≤ 2s on 4G
- **Task Create:** ≤ 200ms (p95)
- **Real-Time Latency:** ≤ 500ms (p95)
- **Bundle Size:** ≤ 250 KB gzip

## Security Considerations

- Never store sensitive data in localStorage
- Always use environment variables for API keys
- Verify Row-Level Security policies in Supabase
- Run `npm audit` regularly
- Enable Dependabot on GitHub

## Debugging

**Real-time sync not working?**
- Check that Realtime is enabled in Supabase dashboard (Database → Replication)
- Verify `board_id` filter is correct in subscription

**Auth not persisting?**
- Check that Supabase session is being stored in browser
- Verify environment variables are correctly set

**Drag-and-drop not working?**
- Check browser console for errors
- Verify @dnd-kit is properly imported and initialized

## Questions?

Feel free to open an issue or reach out! This is a portfolio project, so contributions and questions are welcome.
