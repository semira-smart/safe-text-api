-- 1. USERS TABLE (for API consumers)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    credits INTEGER DEFAULT 100,
    createdAt TIMESTAMP DEFAULT NOW()
);

-- 2. ADMINS TABLE (for admin dashboard login & management)
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT NOW()
);

-- 3. API KEYS (linked to users only)
CREATE TABLE apikeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    theKey TEXT UNIQUE NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT NOW()
);

-- 4. TEXT ANALYSIS REQUESTS (track input and result)
CREATE TABLE text_analysis_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE SET NULL,
    inputText TEXT NOT NULL,
    isProfane BOOLEAN,
    toxicityScore FLOAT,
    createdAt TIMESTAMP DEFAULT NOW()
);

-- 5. USAGE LOGS (track request metadata)
CREATE TABLE usagelogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES admins(id) ON DELETE SET NULL,
    requestId UUID REFERENCES text_analysis_requests(id) ON DELETE SET NULL,
    statusCode INTEGER,
    isSuccessful BOOLEAN DEFAULT FALSE,
    endpointUrl TEXT,
    ipAddress TEXT,
    createdAt TIMESTAMP DEFAULT NOW()
);
