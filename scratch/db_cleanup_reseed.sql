-- ============================================================
-- COMPLETE DB CLEANUP + FRESH MINIMAL SAMPLE DATA
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. CLEAR ALL DATA (in dependency order)
TRUNCATE TABLE complaint_upvotes CASCADE;
TRUNCATE TABLE complaint_updates CASCADE;
TRUNCATE TABLE complaints CASCADE;

-- Remove non-admin users and departments
DELETE FROM departments;
DELETE FROM users WHERE email != 'admin@portal.gov';

-- ============================================================
-- 2. DEPARTMENTS (2 only: Water & Roads)
-- ============================================================
INSERT INTO departments (id, name, description, dept_head_id, created_at)
VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Water', 'Water supply and pipeline grievance unit', NULL, NOW()),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'Roads', 'Roads and infrastructure grievance unit', NULL, NOW());

-- ============================================================
-- 3. USERS
-- All passwords = BCrypt of "password123"
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LkRbE5PNMNS
-- ============================================================

-- Dept Heads
INSERT INTO users (id, name, email, password_hash, role, department_id, created_at)
VALUES
  ('bbbbbbbb-0001-0001-0001-000000000001', 'Water Department Head', 'water.head@portal.gov',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LkRbE5PNMNS', 'DEPT_HEAD',
   'aaaaaaaa-0001-0001-0001-000000000001', NOW()),
  ('bbbbbbbb-0002-0002-0002-000000000002', 'Roads Department Head', 'roads.head@portal.gov',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LkRbE5PNMNS', 'DEPT_HEAD',
   'aaaaaaaa-0002-0002-0002-000000000002', NOW());

-- Link dept heads to departments
UPDATE departments SET dept_head_id = 'bbbbbbbb-0001-0001-0001-000000000001' WHERE id = 'aaaaaaaa-0001-0001-0001-000000000001';
UPDATE departments SET dept_head_id = 'bbbbbbbb-0002-0002-0002-000000000002' WHERE id = 'aaaaaaaa-0002-0002-0002-000000000002';

-- Officers
INSERT INTO users (id, name, email, password_hash, role, department_id, created_at)
VALUES
  ('cccccccc-0001-0001-0001-000000000001', 'Water Officer 1', 'water.officer1@portal.gov',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LkRbE5PNMNS', 'OFFICER',
   'aaaaaaaa-0001-0001-0001-000000000001', NOW()),
  ('cccccccc-0002-0002-0002-000000000002', 'Roads Officer 1', 'roads.officer1@portal.gov',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LkRbE5PNMNS', 'OFFICER',
   'aaaaaaaa-0002-0002-0002-000000000002', NOW());

-- Citizens
INSERT INTO users (id, name, email, password_hash, role, department_id, created_at)
VALUES
  ('dddddddd-0001-0001-0001-000000000001', 'Citizen 1', 'citizen1@example.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LkRbE5PNMNS', 'CITIZEN', NULL, NOW()),
  ('dddddddd-0002-0002-0002-000000000002', 'Citizen 2', 'citizen2@example.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LkRbE5PNMNS', 'CITIZEN', NULL, NOW());

-- ============================================================
-- 4. COMPLAINTS — one per status stage
-- ============================================================

-- C1: FILED (just submitted, no officer yet)
INSERT INTO complaints (id, title, description, category, pincode, area_name, status, priority, citizen_id, department_id, assigned_officer_id, upvote_count, created_at, updated_at)
VALUES (
  'eeeeeeee-0001-0001-0001-000000000001',
  'Broken Water Main Pipe on 4th Main Road',
  'A large water main pipe burst near the 4th main road junction. Water is flooding the footpath and road. Thousands of liters are being wasted. Residents in the area are facing severe water supply shortages.',
  'WATER', '600001', 'Anna Nagar', 'FILED', 'HIGH',
  'dddddddd-0001-0001-0001-000000000001',
  'aaaaaaaa-0001-0001-0001-000000000001',
  NULL, 0, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
);
INSERT INTO complaint_updates (id, complaint_id, actor_id, old_status, new_status, remarks, created_at)
VALUES (gen_random_uuid(), 'eeeeeeee-0001-0001-0001-000000000001',
  'dddddddd-0001-0001-0001-000000000001', NULL, 'FILED', 'Complaint registered by citizen.', NOW() - INTERVAL '2 days');

-- C2: ASSIGNED (dept head assigned to officer)
INSERT INTO complaints (id, title, description, category, pincode, area_name, status, priority, citizen_id, department_id, assigned_officer_id, upvote_count, created_at, updated_at)
VALUES (
  'eeeeeeee-0002-0002-0002-000000000002',
  'Massive Pothole near Metro Station Entrance',
  'A deep pothole (about 2 feet deep) has opened up on the main boulevard approach to the metro station. Multiple motorcycles have skidded and riders injured. The pothole is not barricaded and there are no warning signs.',
  'ROADS', '560001', 'Indiranagar', 'ASSIGNED', 'HIGH',
  'dddddddd-0002-0002-0002-000000000002',
  'aaaaaaaa-0002-0002-0002-000000000002',
  'cccccccc-0002-0002-0002-000000000002', 3, NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'
);
INSERT INTO complaint_updates (id, complaint_id, actor_id, old_status, new_status, remarks, created_at) VALUES
  (gen_random_uuid(), 'eeeeeeee-0002-0002-0002-000000000002', 'dddddddd-0002-0002-0002-000000000002', NULL, 'FILED', 'Complaint registered by citizen.', NOW() - INTERVAL '5 days'),
  (gen_random_uuid(), 'eeeeeeee-0002-0002-0002-000000000002', 'bbbbbbbb-0002-0002-0002-000000000002', 'FILED', 'ASSIGNED', 'Assigned to Roads Officer 1 for immediate inspection.', NOW() - INTERVAL '3 days');
INSERT INTO complaint_upvotes (id, complaint_id, citizen_id, created_at) VALUES
  (gen_random_uuid(), 'eeeeeeee-0002-0002-0002-000000000002', 'dddddddd-0001-0001-0001-000000000001', NOW()),
  (gen_random_uuid(), 'eeeeeeee-0002-0002-0002-000000000002', 'dddddddd-0002-0002-0002-000000000002', NOW());
UPDATE complaints SET upvote_count = 2 WHERE id = 'eeeeeeee-0002-0002-0002-000000000002';

-- C3: IN_PROGRESS (officer started work)
INSERT INTO complaints (id, title, description, category, pincode, area_name, status, priority, citizen_id, department_id, assigned_officer_id, upvote_count, created_at, updated_at)
VALUES (
  'eeeeeeee-0003-0003-0003-000000000003',
  'No Water Supply for 3 Days in Block B',
  'There has been zero water supply in Block B, Anna Nagar for the past 3 days. Residents are forced to buy water tankers at high cost. Pipeline maintenance issue suspected near the junction pump house.',
  'WATER', '600001', 'Anna Nagar', 'IN_PROGRESS', 'HIGH',
  'dddddddd-0001-0001-0001-000000000001',
  'aaaaaaaa-0001-0001-0001-000000000001',
  'cccccccc-0001-0001-0001-000000000001', 1, NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'
);
INSERT INTO complaint_updates (id, complaint_id, actor_id, old_status, new_status, remarks, created_at) VALUES
  (gen_random_uuid(), 'eeeeeeee-0003-0003-0003-000000000003', 'dddddddd-0001-0001-0001-000000000001', NULL, 'FILED', 'Complaint registered by citizen.', NOW() - INTERVAL '7 days'),
  (gen_random_uuid(), 'eeeeeeee-0003-0003-0003-000000000003', 'bbbbbbbb-0001-0001-0001-000000000001', 'FILED', 'ASSIGNED', 'Assigned to Water Officer 1 for pipeline inspection.', NOW() - INTERVAL '5 days'),
  (gen_random_uuid(), 'eeeeeeee-0003-0003-0003-000000000003', 'cccccccc-0001-0001-0001-000000000001', 'ASSIGNED', 'IN_PROGRESS', 'Pump house valve issue identified. Repair crew and materials dispatched to site.', NOW() - INTERVAL '1 day');
INSERT INTO complaint_upvotes (id, complaint_id, citizen_id, created_at) VALUES
  (gen_random_uuid(), 'eeeeeeee-0003-0003-0003-000000000003', 'dddddddd-0002-0002-0002-000000000002', NOW());
UPDATE complaints SET upvote_count = 1 WHERE id = 'eeeeeeee-0003-0003-0003-000000000003';

-- C4: RESOLVED
INSERT INTO complaints (id, title, description, category, pincode, area_name, status, priority, citizen_id, department_id, assigned_officer_id, upvote_count, created_at, updated_at)
VALUES (
  'eeeeeeee-0004-0004-0004-000000000004',
  'Dangerous Road Surface Erosion after Heavy Rain',
  'The asphalt on the 100ft ring road junction was completely washed away after last week''s heavy rains. Vehicles are veering dangerously and there have been 2 accidents. Urgent road repair and barricading needed.',
  'ROADS', '560001', 'Koramangala', 'RESOLVED', 'HIGH',
  'dddddddd-0002-0002-0002-000000000002',
  'aaaaaaaa-0002-0002-0002-000000000002',
  'cccccccc-0002-0002-0002-000000000002', 5, NOW() - INTERVAL '14 days', NOW() - INTERVAL '2 days'
);
INSERT INTO complaint_updates (id, complaint_id, actor_id, old_status, new_status, remarks, created_at) VALUES
  (gen_random_uuid(), 'eeeeeeee-0004-0004-0004-000000000004', 'dddddddd-0002-0002-0002-000000000002', NULL, 'FILED', 'Complaint registered by citizen.', NOW() - INTERVAL '14 days'),
  (gen_random_uuid(), 'eeeeeeee-0004-0004-0004-000000000004', 'bbbbbbbb-0002-0002-0002-000000000002', 'FILED', 'ASSIGNED', 'Assigned to Roads Officer 1 for urgent site visit.', NOW() - INTERVAL '12 days'),
  (gen_random_uuid(), 'eeeeeeee-0004-0004-0004-000000000004', 'cccccccc-0002-0002-0002-000000000002', 'ASSIGNED', 'IN_PROGRESS', 'Barricades placed. Asphalt patching crew on site with materials.', NOW() - INTERVAL '8 days'),
  (gen_random_uuid(), 'eeeeeeee-0004-0004-0004-000000000004', 'cccccccc-0002-0002-0002-000000000002', 'IN_PROGRESS', 'RESOLVED', 'Road surface fully repaired and re-painted. Photo evidence documented.', NOW() - INTERVAL '2 days');
INSERT INTO complaint_upvotes (id, complaint_id, citizen_id, created_at) VALUES
  (gen_random_uuid(), 'eeeeeeee-0004-0004-0004-000000000004', 'dddddddd-0001-0001-0001-000000000001', NOW()),
  (gen_random_uuid(), 'eeeeeeee-0004-0004-0004-000000000004', 'dddddddd-0002-0002-0002-000000000002', NOW());
UPDATE complaints SET upvote_count = 2 WHERE id = 'eeeeeeee-0004-0004-0004-000000000004';

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'departments' AS tbl, COUNT(*) FROM departments
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'complaints', COUNT(*) FROM complaints
UNION ALL SELECT 'complaint_updates', COUNT(*) FROM complaint_updates
UNION ALL SELECT 'complaint_upvotes', COUNT(*) FROM complaint_upvotes;
