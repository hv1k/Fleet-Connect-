-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    user_name text,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    details jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for audit_logs" ON audit_logs FOR ALL USING (true);
