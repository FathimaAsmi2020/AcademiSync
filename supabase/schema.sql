-- ==========================================
-- Supabase Database Schema for AcademiSync Pro
-- ==========================================

-- Enable the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Simplified)
CREATE TABLE profiles (
    id UUID PRIMARY KEY, -- Removed foreign key constraint to make it simpler as requested
    role TEXT CHECK (role IN ('student', 'guide', 'admin')) NOT NULL,
    name TEXT NOT NULL,
    dept TEXT,
    team_id UUID,
    roll_number TEXT,
    staff_id TEXT,
    team_number TEXT,
    team_members JSONB
);

-- 2. Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    dept_category TEXT CHECK (dept_category IN ('software', 'core', 'circuit')) NOT NULL,
    guide_id UUID REFERENCES profiles(id),
    github_url TEXT,
    simulation_links JSONB,
    bom_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key to profiles now that projects table exists
ALTER TABLE profiles 
ADD CONSTRAINT fk_team_id FOREIGN KEY (team_id) REFERENCES projects(id) ON DELETE SET NULL;

-- 3. Submissions Table (Modified to remove 5-level review, now using milestone tracking)
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL,
    version INTEGER NOT NULL,
    milestone_title TEXT NOT NULL, -- e.g., '30% Milestone', '80% Milestone'
    guide_status TEXT CHECK (guide_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    guide_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ip_address TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB
);

-- 5. Approved Master Lists for Registration Verification
CREATE TABLE approved_students (
    roll_number TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    department TEXT NOT NULL,
    is_registered BOOLEAN DEFAULT FALSE
);

CREATE TABLE approved_staff (
    staff_id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    department TEXT NOT NULL,
    is_registered BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- Real-time Subscriptions
-- ==========================================
-- Enable real-time for audit_logs and submissions
alter publication supabase_realtime add table audit_logs;
alter publication supabase_realtime add table submissions;
alter publication supabase_realtime add table projects;

-- ==========================================
-- Row Level Security (RLS) Policies
-- ==========================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projects are viewable by everyone." ON projects FOR SELECT USING (true);
CREATE POLICY "Admins can insert projects." ON projects FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Guides can update their assigned projects." ON projects FOR UPDATE USING (auth.uid() = guide_id);
CREATE POLICY "Students can update their own project." ON projects FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND team_id = projects.id)
);

-- Submissions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Submissions viewable by associated students and guides." ON submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND team_id = submissions.project_id) OR
    EXISTS (SELECT 1 FROM projects WHERE id = submissions.project_id AND guide_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Students can insert submissions for their project." ON submissions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND team_id = submissions.project_id)
);
CREATE POLICY "Guides can update submissions for their projects." ON submissions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE id = submissions.project_id AND guide_id = auth.uid())
);

-- Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view audit logs." ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Anyone can insert audit logs." ON audit_logs FOR INSERT WITH CHECK (true);

-- Approved Lists
ALTER TABLE approved_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read approved students" ON approved_students FOR SELECT USING (true);
CREATE POLICY "Anyone can update registration status" ON approved_students FOR UPDATE USING (true);

ALTER TABLE approved_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read approved staff" ON approved_staff FOR SELECT USING (true);
CREATE POLICY "Anyone can update registration status" ON approved_staff FOR UPDATE USING (true);
