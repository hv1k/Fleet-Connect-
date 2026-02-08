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
