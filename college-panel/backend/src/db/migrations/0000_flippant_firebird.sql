CREATE TABLE "colleges" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"slug" text NOT NULL,
	"type" text NOT NULL,
	"affiliation" text NOT NULL,
	"established_year" integer NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"district" text NOT NULL,
	"state" text NOT NULL,
	"pincode" text NOT NULL,
	"country" text DEFAULT 'India' NOT NULL,
	"primary_contact" jsonb NOT NULL,
	"admin_contact" jsonb NOT NULL,
	"coordinators" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"dashboard_access" boolean DEFAULT true NOT NULL,
	"total_students" integer DEFAULT 0 NOT NULL,
	"active_students" integer DEFAULT 0 NOT NULL,
	"quota_allocated" integer DEFAULT 0 NOT NULL,
	"quota_used" integer DEFAULT 0 NOT NULL,
	"warning_threshold" integer DEFAULT 80 NOT NULL,
	"critical_threshold" integer DEFAULT 95 NOT NULL,
	"department_limits" jsonb DEFAULT '{}'::jsonb,
	"services" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"suspension_reason" text,
	"suspended_at" timestamp,
	"reactivated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "colleges_code_unique" UNIQUE("code"),
	CONSTRAINT "colleges_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "platform_services" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"is_global_active" boolean DEFAULT true NOT NULL,
	"total_college_adoption" integer DEFAULT 0 NOT NULL,
	"total_students_enrolled" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "platform_services_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "quota_history" (
	"id" text PRIMARY KEY NOT NULL,
	"college_id" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"admin_name" text NOT NULL,
	"previous_allocated" integer NOT NULL,
	"new_allocated" integer NOT NULL,
	"reason" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_users" (
	"id" text PRIMARY KEY NOT NULL,
	"college_id" text,
	"college_name" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"role" text NOT NULL,
	"department" text,
	"designation" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"account_status" text DEFAULT 'ACTIVE' NOT NULL,
	"password_hash" text,
	"invitation_id" text,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "student_entitlements" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"student_name" text NOT NULL,
	"roll_number" text NOT NULL,
	"college_id" text NOT NULL,
	"college_name" text NOT NULL,
	"service_id" text NOT NULL,
	"service_name" text NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"granted_date" timestamp DEFAULT now() NOT NULL,
	"expiry_date" timestamp,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" text PRIMARY KEY NOT NULL,
	"college_id" text NOT NULL,
	"college_name" text NOT NULL,
	"name" text NOT NULL,
	"roll_number" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"department" text NOT NULL,
	"course" text,
	"batch" text,
	"access_status" text DEFAULT 'Active' NOT NULL,
	"services" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"entitlement_id" text NOT NULL,
	"provisioning_job_id" text,
	"enrolled_year" integer NOT NULL,
	"resume_count" integer DEFAULT 0 NOT NULL,
	"portfolio_subdomain" text,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provisioning_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"college_id" text NOT NULL,
	"college_name" text NOT NULL,
	"created_by" text NOT NULL,
	"source" text NOT NULL,
	"total_records" integer DEFAULT 0 NOT NULL,
	"successful" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"partial" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'Completed' NOT NULL,
	"failed_records" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"college_id" text NOT NULL,
	"college_name" text NOT NULL,
	"requester" text NOT NULL,
	"requester_email" text NOT NULL,
	"requester_role" text NOT NULL,
	"details" jsonb NOT NULL,
	"priority" text DEFAULT 'Medium' NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"decision_reason" text,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "college_announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"college_id" text,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"author" text NOT NULL,
	"priority" text DEFAULT 'Normal' NOT NULL,
	"target_audience" text DEFAULT 'All Institutions' NOT NULL,
	"read_by_colleges" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "college_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"college_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"due_date" text NOT NULL,
	"priority" text DEFAULT 'Medium' NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"category" text NOT NULL,
	"action_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"college_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"category" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"related_entity" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"action_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "college_agreements" (
	"id" text PRIMARY KEY NOT NULL,
	"college_id" text NOT NULL,
	"agreement_number" text NOT NULL,
	"type" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"document_name" text,
	"document_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"college_id" text NOT NULL,
	"college_name" text NOT NULL,
	"invoice_number" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'Paid' NOT NULL,
	"date" text NOT NULL,
	"due_date" text NOT NULL,
	"payment_method" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"college_id" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"actor_staff_id" text NOT NULL,
	"actor_name" text NOT NULL,
	"actor_role" text NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_name" text NOT NULL,
	"ip" text DEFAULT '127.0.0.1' NOT NULL,
	"result" text DEFAULT 'Success' NOT NULL,
	"before_state" jsonb,
	"after_state" jsonb,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "college_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"designation" text NOT NULL,
	"college_id" text NOT NULL,
	"college_name" text NOT NULL,
	"role" text NOT NULL,
	"invited_by" text NOT NULL,
	"invited_by_role" text NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"status" text DEFAULT 'INVITED' NOT NULL,
	"accepted_at" timestamp,
	"revoked_at" timestamp,
	"revoked_reason" text,
	CONSTRAINT "college_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"email" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "quota_history" ADD CONSTRAINT "quota_history_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_entitlements" ADD CONSTRAINT "student_entitlements_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_entitlements" ADD CONSTRAINT "student_entitlements_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provisioning_jobs" ADD CONSTRAINT "provisioning_jobs_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "college_announcements" ADD CONSTRAINT "college_announcements_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "college_tasks" ADD CONSTRAINT "college_tasks_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "college_agreements" ADD CONSTRAINT "college_agreements_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_invoices" ADD CONSTRAINT "payment_invoices_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "college_invitations" ADD CONSTRAINT "college_invitations_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "college_roll_number_idx" ON "students" USING btree ("college_id","roll_number");--> statement-breakpoint
CREATE UNIQUE INDEX "college_student_email_idx" ON "students" USING btree ("college_id","email");