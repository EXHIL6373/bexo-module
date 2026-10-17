CREATE TABLE IF NOT EXISTS "otp_challenges" (
  "id" text PRIMARY KEY,
  "phone_number" text NOT NULL,
  "otp_hash" text NOT NULL,
  "purpose" text NOT NULL DEFAULT 'login',
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
  "id" text PRIMARY KEY,
  "phone_number" text NOT NULL UNIQUE,
  "phone_verified_at" timestamp NOT NULL DEFAULT now(),
  "google_sub" text UNIQUE,
  "google_email" text,
  "google_verified_at" timestamp,
  "display_name" text,
  "primary_role" text NOT NULL DEFAULT 'normal_user',
  "status" text NOT NULL DEFAULT 'ACTIVE',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "identity_phone_uniq_idx" ON "user_identities" ("phone_number");
CREATE UNIQUE INDEX IF NOT EXISTS "identity_google_sub_uniq_idx" ON "user_identities" ("google_sub");

CREATE TABLE IF NOT EXISTS "identity_role_assignments" (
  "id" text PRIMARY KEY,
  "identity_id" text NOT NULL REFERENCES "user_identities"("id") ON DELETE CASCADE,
  "role" text NOT NULL,
  "college_id" text,
  "college_name" text,
  "entity_id" text,
  "entity_type" text NOT NULL DEFAULT 'consumer',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "asgn_identity_idx" ON "identity_role_assignments" ("identity_id");
CREATE INDEX IF NOT EXISTS "asgn_role_idx" ON "identity_role_assignments" ("role");
CREATE INDEX IF NOT EXISTS "asgn_college_idx" ON "identity_role_assignments" ("college_id");
