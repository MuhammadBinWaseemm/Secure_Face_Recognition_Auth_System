
ALTER DATABASE "Authentication system" RENAME TO authentication_system;

-- 🔹 Users Table (Stores basic user info)
-- Create users table
-- SQL to create users table in PostgreSQL
-- Run this query to set up the database table

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firstname VARCHAR(50) NOT NULL,
    lastname VARCHAR(50) NOT NULL,
    dob DATE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

select * from users;

-- 🔹 Face Authentication Table (Stores facial recognition data)
CREATE TABLE face_auth (
    id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    face_data text NOT NULL, -- Storing face data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
select * from face_auth;

CREATE TABLE user_location (
    location_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    event_type VARCHAR(10) CHECK (event_type IN ('signup', 'login')), -- Tracks event type
    location TEXT NOT NULL,
    ip_address VARCHAR(45) NOT NULL, -- Supports IPv4 & IPv6
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 🔹 Login History Table (Tracks login attempts with locations)
CREATE TABLE login_history (
    login_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    location TEXT NOT NULL
);

-- ✅ INDEXING for Fast Searches
CREATE INDEX idx_users_email ON users(email); -- Optimize email lookup
CREATE INDEX idx_login_history_user ON login_history(user_id); -- Speed up login searches


-- ✅ PARTITIONING for Large Login Data (Split yearly for efficiency)
CREATE TABLE login_history_2025 PARTITION OF login_history 
FOR VALUES FROM ('2025-01-01') TO ('2025-12-31');

