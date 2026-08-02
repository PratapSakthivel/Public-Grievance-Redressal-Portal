-- Create Database Schema for Public Grievance Redressal Portal

-- 1. Create Departments Table (without FK first)
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    dept_head_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Add foreign key for dept_head_id in departments table pointing to users
ALTER TABLE departments 
ADD CONSTRAINT fk_departments_dept_head 
FOREIGN KEY (dept_head_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. Create Complaints Table
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    citizen_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    assigned_officer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    area_name VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'FILED',
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    upvote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Complaint Upvotes Table (unique constraint to prevent double voting)
CREATE TABLE complaint_upvotes (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    citizen_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_complaint_citizen UNIQUE (complaint_id, citizen_id)
);

-- 6. Create Complaint Updates Table (timeline audit log)
CREATE TABLE complaint_updates (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Data
-- Insert Departments
INSERT INTO departments (name, description) VALUES
('Sanitation & Garbage', 'Waste management, public bins, and street cleaning'),
('Water Supply & Sewerage', 'Pipeline leaks, drinking water quality, and sewerage blockages'),
('Electricity & Streetlights', 'Power outages, broken streetlights, and hazardous wiring'),
('Roads & Traffic', 'Potholes, broken footpaths, and traffic signal issues');

-- Insert Users (Password is 'password123' for all seeded users. BCrypt hash is $2a$10$dXJ3ADWyyua565AJd8L9WuxTKB6S/42KCSG.t6p0Z35t1Fj8a7Y4G)
-- Super Admin
INSERT INTO users (name, email, password_hash, role) VALUES
('Super Admin', 'admin@grievance.gov.in', '$2a$10$dXJ3ADWyyua565AJd8L9WuxTKB6S/42KCSG.t6p0Z35t1Fj8a7Y4G', 'SUPER_ADMIN');

-- Department Head for Sanitation (Department ID = 1)
INSERT INTO users (name, email, password_hash, role, department_id) VALUES
('Sarah Jenkins (Dept Head)', 'sarah.head@grievance.gov.in', '$2a$10$dXJ3ADWyyua565AJd8L9WuxTKB6S/42KCSG.t6p0Z35t1Fj8a7Y4G', 'DEPT_HEAD', 1);

-- Update the department with its head id
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE email = 'sarah.head@grievance.gov.in') WHERE id = 1;

-- Officers for Sanitation (Department ID = 1)
INSERT INTO users (name, email, password_hash, role, department_id) VALUES
('Officer John Doe', 'john.officer@grievance.gov.in', '$2a$10$dXJ3ADWyyua565AJd8L9WuxTKB6S/42KCSG.t6p0Z35t1Fj8a7Y4G', 'OFFICER', 1),
('Officer Jane Smith', 'jane.officer@grievance.gov.in', '$2a$10$dXJ3ADWyyua565AJd8L9WuxTKB6S/42KCSG.t6p0Z35t1Fj8a7Y4G', 'OFFICER', 1);

-- Department Head for Water Supply (Department ID = 2)
INSERT INTO users (name, email, password_hash, role, department_id) VALUES
('Robert Vance (Dept Head)', 'robert.head@grievance.gov.in', '$2a$10$dXJ3ADWyyua565AJd8L9WuxTKB6S/42KCSG.t6p0Z35t1Fj8a7Y4G', 'DEPT_HEAD', 2);
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE email = 'robert.head@grievance.gov.in') WHERE id = 2;

-- Officers for Water Supply (Department ID = 2)
INSERT INTO users (name, email, password_hash, role, department_id) VALUES
('Officer Michael Scott', 'michael.officer@grievance.gov.in', '$2a$10$dXJ3ADWyyua565AJd8L9WuxTKB6S/42KCSG.t6p0Z35t1Fj8a7Y4G', 'OFFICER', 2);

-- Citizens
INSERT INTO users (name, email, password_hash, role) VALUES
('Citizen Alice Brown', 'alice@citizen.com', '$2a$10$dXJ3ADWyyua565AJd8L9WuxTKB6S/42KCSG.t6p0Z35t1Fj8a7Y4G', 'CITIZEN'),
('Citizen Bob Green', 'bob@citizen.com', '$2a$10$dXJ3ADWyyua565AJd8L9WuxTKB6S/42KCSG.t6p0Z35t1Fj8a7Y4G', 'CITIZEN');

-- Insert Some Complaints for Testing
INSERT INTO complaints (citizen_id, department_id, title, description, category, pincode, area_name, status, priority, upvote_count) VALUES
((SELECT id FROM users WHERE email = 'alice@citizen.com'), 1, 'Overflowing Garbage Bin', 'The garbage bin near sector 4 community center is overflowing. It has not been cleared for 3 days and is emitting a foul smell.', 'Garbage Collection', '560001', 'Sector 4', 'FILED', 'HIGH', 3),
((SELECT id FROM users WHERE email = 'bob@citizen.com'), 2, 'Main Water Pipeline Leakage', 'Water is gushing out of the underground pipe near the main market street. Thousands of gallons are being wasted.', 'Water Leakage', '560001', 'Market Street', 'ASSIGNED', 'HIGH', 12);

-- Assign the second complaint to Michael Scott and update status/timeline
UPDATE complaints SET assigned_officer_id = (SELECT id FROM users WHERE email = 'michael.officer@grievance.gov.in'), status = 'ASSIGNED' WHERE title = 'Main Water Pipeline Leakage';

INSERT INTO complaint_updates (complaint_id, actor_id, old_status, new_status, remarks) VALUES
((SELECT id FROM complaints WHERE title = 'Main Water Pipeline Leakage'), (SELECT id FROM users WHERE email = 'robert.head@grievance.gov.in'), 'FILED', 'ASSIGNED', 'Assigned to officer Michael Scott for immediate resolution.');
