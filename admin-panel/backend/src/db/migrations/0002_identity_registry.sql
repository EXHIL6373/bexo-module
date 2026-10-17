CREATE TABLE IF NOT EXISTS "otp_challenges" (
  "id" varchar(128) PRIMARY KEY,
  "phone_number" varchar(50) NOT NULL,
  "otp_hash" text NOT NULL,
  "purpose" varchar(32) NOT NULL DEFAULT 'login',
  "attempts" integer NOT NULL DEFAULT 0,
  "max_attempts" integer NOT NULL DEFAULT 3,
  "expires_at" timestamp NOT NULL,
  "is_consumed" boolean NOT NULL DEFAULT false,
  "consumed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "otp_phone_idx" ON "otp_challenges" ("phone_number");
CREATE INDEX IF NOT EXISTS "otp_expires_idx" ON "otp_challenges" ("expires_at");

CREATE TABLE IF NOT EXISTS "user_identities" (
  "id" varchar(128) PRIMARY KEY,
  "phone_number" varchar(50) NOT NULL UNIQUE,
  "phone_verified_at" timestamp NOT NULL DEFAULT now(),
  "google_sub" varchar(128) UNIQUE,
  "google_email" varchar(255),
  "google_verified_at" timestamp,
  "display_name" varchar(255),
  "primary_role" varchar(64) NOT NULL DEFAULT 'normal_user',
  "status" varchar(32) NOT NULL DEFAULT 'ACTIVE',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "identity_phone_uniq_idx" ON "user_identities" ("phone_number");
CREATE UNIQUE INDEX IF NOT EXISTS "identity_google_sub_uniq_idx" ON "user_identities" ("google_sub");

CREATE TABLE IF NOT EXISTS "identity_role_assignments" (
  "id" varchar(128) PRIMARY KEY,
  "identity_id" varchar(128) NOT NULL REFERENCES "user_identities"("id") ON DELETE CASCADE,
  "role" varchar(64) NOT NULL,
  "college_id" varchar(128),
  "college_name" varchar(255),
  "entity_id" varchar(128),
  "entity_type" varchar(64) NOT NULL DEFAULT 'consumer',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "asgn_identity_idx" ON "identity_role_assignments" ("identity_id");
CREATE INDEX IF NOT EXISTS "asgn_role_idx" ON "identity_role_assignments" ("role");
CREATE INDEX IF NOT EXISTS "asgn_college_idx" ON "identity_role_assignments" ("college_id");
