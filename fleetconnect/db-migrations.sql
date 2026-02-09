-- FleetConnect Database Migrations for Phase 2 Field Worker Features
-- Execute these SQL statements in Supabase to create the required tables

-- ============ SERVICE CHECKLISTS TABLE ============
CREATE TABLE IF NOT EXISTS public.service_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    worker_id UUID NOT NULL,
    checklist_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamps JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_checklists_job_id ON public.service_checklists(job_id);
CREATE INDEX IF NOT EXISTS idx_service_checklists_worker_id ON public.service_checklists(worker_id);
CREATE INDEX IF NOT EXISTS idx_service_checklists_created_at ON public.service_checklists(created_at);

-- ============ TIME ENTRIES TABLE ============
CREATE TABLE IF NOT EXISTS public.time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL,
    job_id VARCHAR(255) NOT NULL,
    clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out TIMESTAMP WITH TIME ZONE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    type VARCHAR(50) NOT NULL DEFAULT 'on-site',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_worker_id ON public.time_entries(worker_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_job_id ON public.time_entries(job_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_clock_in ON public.time_entries(clock_in);
CREATE INDEX IF NOT EXISTS idx_time_entries_created_at ON public.time_entries(created_at);

-- ============ ROW LEVEL SECURITY (RLS) ============
-- Service Checklists RLS
ALTER TABLE public.service_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_checklists_worker_own" ON public.service_checklists
    FOR SELECT
    USING (auth.uid()::text = worker_id::text);

CREATE POLICY "service_checklists_insert_own" ON public.service_checklists
    FOR INSERT
    WITH CHECK (auth.uid()::text = worker_id::text);

-- Time Entries RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_entries_worker_own" ON public.time_entries
    FOR SELECT
    USING (auth.uid()::text = worker_id::text);

CREATE POLICY "time_entries_insert_own" ON public.time_entries
    FOR INSERT
    WITH CHECK (auth.uid()::text = worker_id::text);

-- Admin can view all (if needed)
CREATE POLICY "service_checklists_admin_view" ON public.service_checklists
    FOR SELECT
    USING (true); -- Replace with actual admin check

CREATE POLICY "time_entries_admin_view" ON public.time_entries
    FOR SELECT
    USING (true); -- Replace with actual admin check

-- ============ FEATURE FLAGS ============
-- Add new feature flags for Phase 2 features (if not already present)
-- These control the display of Navigation, Checklist, and Time Tracking features

-- INSERT INTO feature_flags (role, feature_key, enabled) VALUES
-- ('fieldworker', 'navigation', true),
-- ('fieldworker', 'service_checklist', true),
-- ('fieldworker', 'time_tracking', true)
-- ON CONFLICT (role, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;

-- ============ RLS POLICIES FOR CORE TABLES ============
-- Helper: get current user's role from the users table
-- Usage: (SELECT role FROM public.users WHERE id = auth.uid())

-- ============ USERS TABLE RLS ============
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own" ON public.users
    FOR SELECT
    USING (auth.uid()::text = id::text);

CREATE POLICY "users_admin_read_all" ON public.users
    FOR SELECT
    USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "users_admin_write_all" ON public.users
    FOR ALL
    USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- ============ JOBS TABLE RLS ============
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_admin_rental_vendor_read" ON public.jobs
    FOR SELECT
    USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'rental', 'vendor'));

CREATE POLICY "jobs_fieldworker_read_assigned" ON public.jobs
    FOR SELECT
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'fieldworker'
        AND assigned_worker::text = auth.uid()::text
    );

CREATE POLICY "jobs_admin_rental_vendor_insert" ON public.jobs
    FOR INSERT
    WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'rental', 'vendor'));

CREATE POLICY "jobs_admin_rental_vendor_update" ON public.jobs
    FOR UPDATE
    USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'rental', 'vendor'));

-- ============ INVOICES TABLE RLS ============
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_admin_rental_read_all" ON public.invoices
    FOR SELECT
    USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'rental'));

CREATE POLICY "invoices_vendor_read_own" ON public.invoices
    FOR SELECT
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'vendor'
        AND vendor_id::text = (SELECT vendor_id::text FROM public.users WHERE id = auth.uid())
    );

CREATE POLICY "invoices_fieldworker_read_own" ON public.invoices
    FOR SELECT
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'fieldworker'
        AND worker_id::text = auth.uid()::text
    );

-- ============ EQUIPMENT TABLE RLS ============
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "equipment_admin_rental_all" ON public.equipment
    FOR ALL
    USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'rental'));

CREATE POLICY "equipment_vendor_read" ON public.equipment
    FOR SELECT
    USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'vendor');

-- ============ MESSAGES TABLE RLS ============
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_read_own_conversations" ON public.messages
    FOR SELECT
    USING (
        sender_id::text = auth.uid()::text
        OR recipient_id::text = auth.uid()::text
    );

CREATE POLICY "messages_insert_authenticated" ON public.messages
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============ ACTIVITY_LOG TABLE RLS ============
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log_admin_read_all" ON public.activity_log
    FOR SELECT
    USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "activity_log_read_own" ON public.activity_log
    FOR SELECT
    USING (user_id::text = auth.uid()::text);

-- ============ COMPANIES TABLE RLS ============
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_admin_all" ON public.companies
    FOR ALL
    USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "companies_read_own" ON public.companies
    FOR SELECT
    USING (
        id::text = (SELECT company_id::text FROM public.users WHERE id = auth.uid())
    );

-- ============ DELIVERIES TABLE RLS ============
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deliveries_admin_rental_vendor_read" ON public.deliveries
    FOR SELECT
    USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'rental', 'vendor'));

CREATE POLICY "deliveries_fieldworker_read_assigned" ON public.deliveries
    FOR SELECT
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'fieldworker'
        AND delivered_by::text = auth.uid()::text
    );

CREATE POLICY "deliveries_admin_rental_vendor_insert" ON public.deliveries
    FOR INSERT
    WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'rental', 'vendor'));

CREATE POLICY "deliveries_admin_rental_vendor_update" ON public.deliveries
    FOR UPDATE
    USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'rental', 'vendor'));

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON public.notifications
    FOR SELECT USING (true);

CREATE POLICY "notifications_update" ON public.notifications
    FOR UPDATE USING (true);

CREATE POLICY "notifications_insert" ON public.notifications
    FOR INSERT WITH CHECK (true);
