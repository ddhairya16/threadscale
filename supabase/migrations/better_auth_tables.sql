-- ============================================================
-- Better Auth Database Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
-- "user" must be double-quoted because it is a PostgreSQL reserved word.
-- All other table names (session, account, verification) are fine as-is.
-- ============================================================

-- 1. Better Auth user table ("user" is double-quoted — required in PostgreSQL)
CREATE TABLE IF NOT EXISTS "user" (
    id              text        NOT NULL PRIMARY KEY,
    name            text        NOT NULL,
    email           text        NOT NULL UNIQUE,
    "emailVerified" boolean     NOT NULL DEFAULT false,
    image           text,
    "createdAt"     timestamp   NOT NULL DEFAULT now(),
    "updatedAt"     timestamp   NOT NULL DEFAULT now()
);

-- 2. Better Auth session table
CREATE TABLE IF NOT EXISTS session (
    id            text        NOT NULL PRIMARY KEY,
    "expiresAt"   timestamp   NOT NULL,
    token         text        NOT NULL UNIQUE,
    "createdAt"   timestamp   NOT NULL DEFAULT now(),
    "updatedAt"   timestamp   NOT NULL DEFAULT now(),
    "ipAddress"   text,
    "userAgent"   text,
    "userId"      text        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- 3. Better Auth account table
CREATE TABLE IF NOT EXISTS account (
    id                        text        NOT NULL PRIMARY KEY,
    "accountId"               text        NOT NULL,
    "providerId"              text        NOT NULL,
    "userId"                  text        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "accessToken"             text,
    "refreshToken"            text,
    "idToken"                 text,
    "accessTokenExpiresAt"    timestamp,
    "refreshTokenExpiresAt"   timestamp,
    scope                     text,
    password                  text,
    "createdAt"               timestamp   NOT NULL DEFAULT now(),
    "updatedAt"               timestamp   NOT NULL DEFAULT now()
);

-- 4. Better Auth verification table (stores magic link tokens)
CREATE TABLE IF NOT EXISTS verification (
    id            text        NOT NULL PRIMARY KEY,
    identifier    text        NOT NULL,
    value         text        NOT NULL,
    "expiresAt"   timestamp   NOT NULL,
    "createdAt"   timestamp   DEFAULT now(),
    "updatedAt"   timestamp   DEFAULT now()
);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS session_userId_idx          ON session("userId");
CREATE INDEX IF NOT EXISTS account_userId_idx          ON account("userId");
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier);

SELECT 'Better Auth tables created successfully' AS status;
