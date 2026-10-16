CREATE TABLE "app_templates" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"category" varchar(64) NOT NULL,
	"description" text,
	"version" varchar(32) DEFAULT '1.0.0' NOT NULL,
	"thumbnail_color" varchar(64) DEFAULT '#3b82f6',
	"preview_url" text,
	"tier" varchar(32) DEFAULT 'Free' NOT NULL,
	"status" varchar(32) DEFAULT 'Published' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"downloads_count" integer DEFAULT 0 NOT NULL,
	"active_users_count" integer DEFAULT 0 NOT NULL,
	"tags" jsonb DEFAULT '[]' NOT NULL,
	"source_bundle" text,
	"compatible_app_version" varchar(32) DEFAULT '>=1.0.0',
	"author" varchar(255) DEFAULT 'BEXO Studio',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"type" varchar(64) NOT NULL,
	"college_id" varchar(128) NOT NULL,
	"college_name" varchar(255) NOT NULL,
	"requester" varchar(255) NOT NULL,
	"requester_email" varchar(255) NOT NULL,
	"requester_role" varchar(64) NOT NULL,
	"details" jsonb DEFAULT '{}' NOT NULL,
	"priority" varchar(32) DEFAULT 'Medium' NOT NULL,
	"status" varchar(32) DEFAULT 'Pending' NOT NULL,
	"decision_reason" text,
	"reviewed_by" varchar(255),
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"actor_staff_id" varchar(128) NOT NULL,
	"actor_name" varchar(255) NOT NULL,
	"actor_role" varchar(64) NOT NULL,
	"action" varchar(128) NOT NULL,
	"entity" varchar(128) NOT NULL,
	"entity_id" varchar(128) NOT NULL,
	"entity_name" varchar(255) NOT NULL,
	"ip" varchar(64) DEFAULT '127.0.0.1' NOT NULL,
	"result" varchar(32) DEFAULT 'Success' NOT NULL,
	"before_state" jsonb,
	"after_state" jsonb,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "colleges" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(64) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"type" varchar(64) NOT NULL,
	"affiliation" varchar(255),
	"established_year" integer,
	"address" text,
	"city" varchar(128),
	"district" varchar(128),
	"state" varchar(128),
	"pincode" varchar(32),
	"country" varchar(64) DEFAULT 'India',
	"primary_contact" jsonb,
	"admin_contact" jsonb,
	"coordinators" jsonb DEFAULT '[]',
	"status" varchar(32) DEFAULT 'Active' NOT NULL,
	"dashboard_access" boolean DEFAULT true NOT NULL,
	"total_students" integer DEFAULT 0,
	"active_students" integer DEFAULT 0,
	"quota_allocated" integer DEFAULT 1000 NOT NULL,
	"quota_used" integer DEFAULT 0 NOT NULL,
	"warning_threshold" integer DEFAULT 80,
	"critical_threshold" integer DEFAULT 95,
	"department_limits" jsonb DEFAULT '{}',
	"services" jsonb DEFAULT '[]',
	"agreement" jsonb DEFAULT '{}',
	"suspension_reason" text,
	"suspended_at" timestamp,
	"reactivated_at" timestamp,
	"last_activity_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "colleges_code_unique" UNIQUE("code"),
	CONSTRAINT "colleges_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"raw_token" varchar(128),
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone" varchar(50),
	"designation" varchar(128) NOT NULL,
	"college_id" varchar(128),
	"college_name" varchar(255),
	"role" varchar(64) NOT NULL,
	"invited_by" varchar(255) NOT NULL,
	"invited_by_role" varchar(64) NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"status" varchar(32) DEFAULT 'INVITED' NOT NULL,
	"accepted_at" timestamp,
	"revoked_at" timestamp,
	"revoked_reason" text
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"category" varchar(64) NOT NULL,
	"severity" varchar(32) DEFAULT 'info' NOT NULL,
	"related_entity" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"action_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"raw_token" varchar(128),
	"email" varchar(255) NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_invoices" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"invoice_number" varchar(64) NOT NULL,
	"college_id" varchar(128) NOT NULL,
	"college_name" varchar(255) NOT NULL,
	"amount" integer NOT NULL,
	"status" varchar(32) DEFAULT 'Paid' NOT NULL,
	"date" varchar(32) NOT NULL,
	"due_date" varchar(32) NOT NULL,
	"payment_method" varchar(64) NOT NULL,
	"description" text,
	CONSTRAINT "payment_invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "platform_services" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"code" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(128) NOT NULL,
	"description" text,
	"is_global_active" boolean DEFAULT true NOT NULL,
	"total_college_adoption" integer DEFAULT 0,
	"total_students_enrolled" integer DEFAULT 0,
	CONSTRAINT "platform_services_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "provisioning_jobs" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"college_id" varchar(128) NOT NULL,
	"college_name" varchar(255) NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"source" varchar(64) NOT NULL,
	"total_records" integer DEFAULT 0 NOT NULL,
	"successful" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"partial" integer DEFAULT 0 NOT NULL,
	"status" varchar(32) DEFAULT 'Queued' NOT NULL,
	"failed_records" jsonb DEFAULT '[]',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "quota_history" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"college_id" varchar(128) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"admin_name" varchar(255) NOT NULL,
	"previous_allocated" integer NOT NULL,
	"new_allocated" integer NOT NULL,
	"reason" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"session_version" integer DEFAULT 1 NOT NULL,
	"ip" varchar(64),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_users" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50),
	"role" varchar(64) NOT NULL,
	"college_id" varchar(128),
	"college_name" varchar(255),
	"department" varchar(128),
	"designation" varchar(128),
	"is_active" boolean DEFAULT true NOT NULL,
	"account_status" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
	"session_version" integer DEFAULT 1 NOT NULL,
	"avatar_url" text,
	"invitation_id" varchar(128),
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "student_entitlements" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"student_id" varchar(128) NOT NULL,
	"student_name" varchar(255) NOT NULL,
	"roll_number" varchar(64) NOT NULL,
	"college_id" varchar(128) NOT NULL,
	"college_name" varchar(255) NOT NULL,
	"service_id" varchar(128) NOT NULL,
	"service_name" varchar(255) NOT NULL,
	"status" varchar(32) DEFAULT 'Active' NOT NULL,
	"granted_date" timestamp DEFAULT now() NOT NULL,
	"expiry_date" timestamp,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"roll_number" varchar(64) NOT NULL,
	"college_id" varchar(128) NOT NULL,
	"college_name" varchar(255) NOT NULL,
	"department" varchar(128) NOT NULL,
	"course" varchar(128),
	"batch" varchar(32),
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"access_status" varchar(32) DEFAULT 'Active' NOT NULL,
	"services" jsonb DEFAULT '[]',
	"entitlement_id" varchar(128),
	"provisioning_job_id" varchar(128),
	"enrolled_year" integer,
	"resume_count" integer DEFAULT 0,
	"portfolio_subdomain" varchar(128),
	"last_activity_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_invoices" ADD CONSTRAINT "payment_invoices_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provisioning_jobs" ADD CONSTRAINT "provisioning_jobs_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quota_history" ADD CONSTRAINT "quota_history_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_staff_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_entitlements" ADD CONSTRAINT "student_entitlements_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "template_slug_uniq_idx" ON "app_templates" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "template_category_idx" ON "app_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "template_status_idx" ON "app_templates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "approval_status_idx" ON "approval_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "approval_college_idx" ON "approval_requests" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_logs" USING btree ("actor_staff_id");--> statement-breakpoint
CREATE INDEX "audit_timestamp_idx" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "college_status_idx" ON "colleges" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "college_code_uniq_idx" ON "colleges" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "college_slug_uniq_idx" ON "colleges" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitation_token_hash_idx" ON "invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "notif_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "reset_token_email_idx" ON "password_reset_tokens" USING btree ("email");--> statement-breakpoint
CREATE INDEX "reset_token_hash_idx" ON "password_reset_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "invoice_college_idx" ON "payment_invoices" USING btree ("college_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_num_uniq_idx" ON "payment_invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE UNIQUE INDEX "service_code_uniq_idx" ON "platform_services" USING btree ("code");--> statement-breakpoint
CREATE INDEX "job_college_idx" ON "provisioning_jobs" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "quota_college_idx" ON "quota_history" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "staff_role_idx" ON "staff_users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "staff_college_idx" ON "staff_users" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "entitlement_student_idx" ON "student_entitlements" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "entitlement_college_idx" ON "student_entitlements" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "student_college_idx" ON "students" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "student_email_idx" ON "students" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "student_college_roll_uniq_idx" ON "students" USING btree ("college_id","roll_number");