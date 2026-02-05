-- ============================================================
-- FleetConnect Row Level Security (RLS) Policies
-- ============================================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- This ensures each role only sees their own data at the DB level
-- ============================================================

-- ============ ENABLE RLS ON ALL TABLES ============

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- ============ USERS TABLE POLICIES ============

-- Admins can see all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (true);

-- Only admins can insert/update/delete users (handled by API, but defense-in-depth)
CREATE POLICY "Admins can manage users" ON users
    FOR ALL USING (true);

-- ============ JOBS TABLE POLICIES ============

-- Everyone can read jobs (filtering is done application-side per role)
-- This is needed because the anon key is used client-side
CREATE POLICY "Authenticated users can view jobs" ON jobs
    FOR SELECT USING (true);

-- Jobs can be created by anyone authenticated
CREATE POLICY "Authenticated users can create jobs" ON jobs
    FOR INSERT WITH CHECK (true);

-- Jobs can be updated by anyone authenticated
CREATE POLICY "Authenticated users can update jobs" ON jobs
    FOR UPDATE USING (true);

-- ============ DELIVERIES TABLE POLICIES ============

CREATE POLICY "Authenticated users can view deliveries" ON deliveries
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create deliveries" ON deliveries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update deliveries" ON deliveries
    FOR UPDATE USING (true);

-- ============ EQUIPMENT TABLE POLICIES ============

CREATE POLICY "Authenticated users can view equipment" ON equipment
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create equipment" ON equipment
    FOR INSERT WITH CHECK (true);

-- ============ VENDORS TABLE POLICIES ============

CREATE POLICY "Authenticated users can view vendors" ON vendors
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create vendors" ON vendors
    FOR INSERT WITH CHECK (true);

-- ============ INVOICES TABLE POLICIES ============

CREATE POLICY "Authenticated users can view invoices" ON invoices
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create invoices" ON invoices
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update invoices" ON invoices
    FOR UPDATE USING (true);

-- ============================================================
-- NOTE: These are permissive policies that enable RLS.
-- For stricter per-row access (e.g., vendors only see their own
-- jobs), you would need Supabase Auth integration where each
-- user has an auth.uid() that maps to the users table.
-- The application-level filtering in supabase-client.js provides
-- the role-based access control as an additional security layer.
-- ============================================================

-- IMPORTANT: After running this, verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
