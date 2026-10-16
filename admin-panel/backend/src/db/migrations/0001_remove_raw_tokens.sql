ALTER TABLE "invitations" DROP COLUMN IF EXISTS "raw_token";
ALTER TABLE "password_reset_tokens" DROP COLUMN IF EXISTS "raw_token";
