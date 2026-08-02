-- Supabase Schema for Public Grievance Redressal Portal

-- 1. Create Enums
CREATE TYPE role AS ENUM ('CITIZEN', 'OFFICER', 'DEPT_HEAD', 'SUPER_ADMIN');
CREATE TYPE category AS ENUM ('WATER', 'ROADS', 'ELECTRICITY', 'SANITATION', 'PUBLIC_HEALTH', 'OTHER');
CREATE TYPE status AS ENUM ('FILED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED', 'CLOSED');
CREATE TYPE priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- 2. Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    dept_head_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role role NOT NULL DEFAULT 'CITIZEN',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint for dept_head_id
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_dept_head
    FOREIGN KEY (dept_head_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    assigned_officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category category NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    area_name VARCHAR(255),
    status status NOT NULL DEFAULT 'FILED',
    priority priority NOT NULL DEFAULT 'MEDIUM',
    upvote_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create complaint_upvotes table
CREATE TABLE IF NOT EXISTS complaint_upvotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_complaint_citizen UNIQUE (complaint_id, citizen_id)
);

-- 6. Create complaint_updates table
CREATE TABLE IF NOT EXISTS complaint_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_status status,
    new_status status NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
