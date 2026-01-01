# Migration Cleanup Plan

## Tujuan
Membersihkan semua migration files dan membuat struktur migration yang bersih, terorganisir, dan mudah di-maintain. Setiap migration file akan fokus pada 1 tabel/concern saja.

---

## Tahap 1: Verifikasi Database Aktual

### 1.1 Download Schema dari Supabase
```bash
# Cara 1: Via Supabase Studio
# Dashboard → Database → Schema Visualizer → Export SQL

# Cara 2: Via Supabase CLI (recommended)
supabase db dump --db-url "postgresql://..." > actual_schema.sql

# Cara 3: Via pg_dump
pg_dump -h db.xxx.supabase.co -U postgres -d postgres --schema-only > actual_schema.sql
```

**Output**: `actual_schema.sql` - Schema yang benar-benar ada di production/development

### 1.2 List Semua Table yang Ada
```sql
-- Jalankan query ini di Supabase SQL Editor
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Catat semua table yang ada:**
- [ ] boards
- [ ] board_members
- [ ] board_pages
- [ ] board_statuses
- [ ] tasks
- [ ] task_activity_log
- [ ] task_comments
- [ ] task_pages
- [ ] task_relations
- [ ] user_profiles
- [ ] ... (table lainnya)

### 1.3 List Semua Index yang Ada
```sql
-- Query untuk melihat semua indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

**Output**: Daftar semua index yang benar-benar ada di database

### 1.4 List Semua Foreign Keys & Constraints
```sql
-- Query untuk foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

### 1.5 List Semua RLS Policies
```sql
-- Query untuk Row Level Security policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 1.6 List Semua Triggers
```sql
-- Query untuk triggers
SELECT
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

---

## Tahap 2: Audit Migration Files Existing

### 2.1 List Semua Migration Files
```bash
ls -la supabase/migrations/
```

**Catat:**
- Berapa banyak migration files (001-027?)
- Migration mana yang duplicate
- Migration mana yang di folder archive
- Migration mana yang sudah applied di production

### 2.2 Cek Migration Yang Sudah Applied
```sql
-- Query table supabase_migrations
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version;
```

**Output**: Daftar migration yang sudah jalan di database

### 2.3 Audit Setiap Migration File
Buat tabel audit seperti ini:

| File | Tables Modified | Indexes | Constraints | RLS | Status | Notes |
|------|----------------|---------|-------------|-----|--------|-------|
| 001_complete_schema.sql | boards, tasks, ... | ✓ | ✓ | ✓ | Keep | Base schema |
| 002_user_profiles_setup.sql | user_profiles | ✓ | ✓ | ✓ | Merge? | Duplicate with 001? |
| 025_add_performance_indexes.sql | - | Wrong indexes | - | - | DELETE | Wrong table names |
| 026_cleanup_wrong_indexes.sql | - | Drop only | - | - | DELETE | Local dev only |
| 027_add_actual_performance_indexes.sql | - | ✓ | - | - | Keep | Production ready |

---

## Tahap 3: Verify Dengan Kode Aplikasi

### 3.1 Audit Semua Query di Hooks
```bash
# Search semua query .from() di codebase
grep -r "\.from\(" src/hooks/ --include="*.ts" --include="*.tsx"
```

**Catat semua table yang di-query:**
- src/hooks/useTasks.ts → tasks, board_statuses, board_members
- src/hooks/useBoardPages.ts → board_pages
- src/hooks/useTaskComments.ts → task_comments, task_activity_log
- src/hooks/useBatchUserProfiles.ts → user_profiles
- ... dst

### 3.2 Verify Semua Column Yang Dipakai
Untuk setiap table, catat column apa saja yang benar-benar dipakai di `.select()`:

**Example untuk `tasks` table:**
```typescript
// useTasks.ts:36-38
.select(`
  *,
  board_status:board_statuses!tasks_status_id_fkey(id, name, color, order_index)
`)
```

**Column yang dipakai:** semua column + relation ke board_statuses

### 3.3 Verify Semua Filter/Order Pattern
Catat query pattern untuk menentukan index yang diperlukan:

**Example:**
- `tasks`: `.eq('board_id').is('parent_task_id', null).order('order_index')`
  → Index needed: `(board_id, parent_task_id, order_index)`

- `board_pages`: `.eq('board_id').order('position')`
  → Index needed: `(board_id, position)`

---

## Tahap 4: Buat Migration Baru Yang Bersih

### 4.1 Struktur Migration Baru
```
supabase/migrations/
├── 000_cleanup.sql                          # Drop all (dev only)
├── 001_core_tables.sql                      # boards, user_profiles
├── 002_board_statuses.sql                   # board_statuses + RLS
├── 003_board_members.sql                    # board_members + RLS
├── 004_tasks.sql                            # tasks table + RLS
├── 005_task_relations.sql                   # task_relations + RLS
├── 006_task_comments_activity.sql           # task_comments + task_activity_log + RLS
├── 007_task_pages.sql                       # task_pages + RLS (subtasks)
├── 008_board_pages.sql                      # board_pages + RLS (documentation)
├── 009_performance_indexes.sql              # ALL indexes based on actual queries
├── 010_triggers_functions.sql               # Triggers & functions if any
└── archive/                                 # Old migrations (backup)
    └── old_migrations_backup_YYYYMMDD/
        ├── 001_complete_schema.sql
        ├── 002_...
        └── ... (semua migration lama)
```

### 4.2 Template Untuk Setiap Migration File

```sql
-- ============================================================================
-- [NUMBER]_[table_name].sql
-- Purpose: [Deskripsi singkat]
-- Dependencies: [Migration mana yang harus jalan dulu]
-- ============================================================================

-- Drop table if exists (dev only, comment out for production)
-- DROP TABLE IF EXISTS [table_name] CASCADE;

-- ============================================================================
-- TABLE DEFINITION
-- ============================================================================

CREATE TABLE IF NOT EXISTS [table_name] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... columns ...
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Only indexes specific to this table's queries
-- (composite indexes di 009_performance_indexes.sql)

CREATE INDEX IF NOT EXISTS idx_[table]_[column]
ON [table]([column]);

-- ============================================================================
-- FOREIGN KEYS
-- ============================================================================

ALTER TABLE [table_name]
ADD CONSTRAINT fk_[table]_[ref_table]
FOREIGN KEY ([column]) REFERENCES [ref_table](id)
ON DELETE CASCADE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read ...
CREATE POLICY "policy_name"
ON [table_name]
FOR SELECT
USING (...);

-- Policy: Users can insert ...
CREATE POLICY "policy_name"
ON [table_name]
FOR INSERT
WITH CHECK (...);

-- Policy: Users can update ...
CREATE POLICY "policy_name"
ON [table_name]
FOR UPDATE
USING (...);

-- Policy: Users can delete ...
CREATE POLICY "policy_name"
ON [table_name]
FOR DELETE
USING (...);

-- ============================================================================
-- ENABLE REALTIME (if needed)
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE [table_name];

-- ============================================================================
-- NOTES
-- ============================================================================
-- - Add any important notes about this table
-- - Document any complex business logic
-- - Link to related code files (e.g., src/hooks/use[Table].ts)
```

### 4.3 File 009_performance_indexes.sql
File ini khusus untuk composite indexes dan indexes yang melibatkan multiple tables:

```sql
-- ============================================================================
-- 009_performance_indexes.sql
-- Purpose: Performance indexes based on actual query patterns
-- Dependencies: 001-008 (all table migrations)
-- ============================================================================

-- Each index is documented with:
-- 1. Which file uses it (e.g., src/hooks/useTasks.ts:35-42)
-- 2. The actual query pattern
-- 3. Why this index is needed

-- ============================================================================
-- TASKS INDEXES
-- ============================================================================

-- Main kanban query (useTasks.ts:35-42)
-- Query: .eq('board_id').is('parent_task_id', null).order('order_index')
CREATE INDEX IF NOT EXISTS idx_tasks_board_parent_order
ON tasks(board_id, parent_task_id, order_index)
WHERE parent_task_id IS NULL;

-- ... dst untuk semua composite indexes
```

---

## Tahap 5: Testing Migration Baru

### 5.1 Test di Fresh Database (Local)
```bash
# 1. Buat database baru untuk testing
supabase db reset

# 2. Jalankan semua migration baru
supabase db push

# 3. Verify semua table ada
# Jalankan query di Tahap 1.2

# 4. Verify semua index ada
# Jalankan query di Tahap 1.3

# 5. Test aplikasi
npm run dev
# Test semua fitur: create board, add task, comments, etc.
```

### 5.2 Compare Schema
```bash
# Dump schema baru
supabase db dump --db-url "local" > new_schema.sql

# Compare dengan production
diff actual_schema.sql new_schema.sql
```

**Expected**: Hanya perbedaan di migration_version, tidak ada perbedaan di table structure

### 5.3 Test Performance
```sql
-- Test query dengan EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT *
FROM tasks
WHERE board_id = 'xxx'
  AND parent_task_id IS NULL
ORDER BY order_index;

-- Verify index dipakai:
-- Harus muncul "Index Scan using idx_tasks_board_parent_order"
```

---

## Tahap 6: Cleanup & Archive

### 6.1 Archive Migration Lama
```bash
# Buat folder archive dengan timestamp
mkdir -p supabase/migrations/archive/old_migrations_$(date +%Y%m%d)

# Pindahkan semua migration lama
mv supabase/migrations/0*.sql supabase/migrations/archive/old_migrations_*/

# Kecuali yang baru (000-010)
# Keep: 000-010 di folder migrations/
```

### 6.2 Update Documentation
Update `README.md` dengan:
- Struktur migration baru
- Cara menjalankan migration
- Apa yang dilakukan setiap migration file

### 6.3 Git Commit
```bash
git add .
git commit -m "Refactor: Clean up and reorganize database migrations

- Consolidate 27 migration files into 10 organized files
- Each migration file now handles one concern/table
- All indexes based on actual query patterns from codebase
- Archive old migrations for reference
- Fully tested on fresh database

Migration structure:
001: Core tables (boards, user_profiles)
002: Board statuses
003: Board members
004: Tasks
005: Task relations
006: Task comments & activity
007: Task pages (subtasks)
008: Board pages (documentation)
009: Performance indexes
010: Triggers & functions
"
```

---

## Tahap 7: Deploy ke Production (Hati-hati!)

### 7.1 Backup Production Database
```bash
# WAJIB backup dulu!
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup_before_migration_$(date +%Y%m%d).sql
```

### 7.2 Strategy untuk Production

**Option A: Additive-only migration (RECOMMENDED)**
- Migration baru HANYA menambah yang belum ada
- Tidak drop/alter apapun
- Aman untuk production yang sudah jalan

**Option B: Fresh migration (RISKY)**
- Hanya untuk production baru/staging
- Drop semua, create dari awal
- JANGAN lakukan di production yang sudah ada data!

### 7.3 Jalankan Migration di Production
```bash
# Push migration baru (hanya 009-010 yang baru)
# Migration 001-008 skip karena table sudah ada
supabase db push --dry-run  # Preview dulu
supabase db push            # Jalankan
```

---

## Checklist Final

- [ ] **Tahap 1**: Download & verify actual schema dari production
- [ ] **Tahap 2**: Audit semua migration files existing
- [ ] **Tahap 3**: Verify dengan kode aplikasi (hooks)
- [ ] **Tahap 4**: Buat migration baru yang bersih (000-010)
- [ ] **Tahap 5**: Test di fresh local database
- [ ] **Tahap 6**: Archive migration lama
- [ ] **Tahap 7**: Deploy ke production dengan backup

---

## Tools & Commands Reference

### Supabase CLI
```bash
# Login
supabase login

# Link project
supabase link --project-ref xxx

# Dump schema
supabase db dump --db-url "postgres://..." > schema.sql

# Reset local database
supabase db reset

# Push migrations
supabase db push

# Pull remote schema
supabase db pull
```

### PostgreSQL Useful Queries
```sql
-- List all tables with row counts
SELECT
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM quote_ident(schemaname) || '.' || quote_ident(tablename))::bigint as row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check table size
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Show index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

## Notes Penting

1. **JANGAN PERNAH** edit migration yang sudah applied di production
2. **SELALU** backup sebelum migration
3. **TEST** di local/staging dulu sebelum production
4. **DOCUMENT** setiap migration dengan jelas
5. **VERIFY** dengan actual code di aplikasi
6. Migration baru harus **IDEMPOTENT** (bisa dijalankan berulang kali)
7. Gunakan `IF NOT EXISTS` / `IF EXISTS` untuk safety

---

## Contact / References

- Supabase Migration Docs: https://supabase.com/docs/guides/database/migrations
- PostgreSQL Index Docs: https://www.postgresql.org/docs/current/indexes.html
- RLS Docs: https://supabase.com/docs/guides/auth/row-level-security

---

**Last Updated**: 2026-01-01
**Status**: Draft - Ready for execution
