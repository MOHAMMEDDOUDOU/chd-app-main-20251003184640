-- Migration: Add chat tables
-- Created at: 2024-01-27

-- Create conversations table
CREATE TABLE IF NOT EXISTS "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"message_type" varchar(20) DEFAULT 'text' NOT NULL,
	"content" text,
	"file_url" varchar(500),
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for conversations
CREATE INDEX IF NOT EXISTS "idx_conversations_user_id" ON "conversations" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_conversations_admin_id" ON "conversations" ("admin_id");
CREATE INDEX IF NOT EXISTS "idx_conversations_status" ON "conversations" ("status");
CREATE INDEX IF NOT EXISTS "idx_conversations_created_at" ON "conversations" ("created_at");

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS "idx_messages_conversation_id" ON "messages" ("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_messages_sender_id" ON "messages" ("sender_id");
CREATE INDEX IF NOT EXISTS "idx_messages_type" ON "messages" ("message_type");
CREATE INDEX IF NOT EXISTS "idx_messages_is_read" ON "messages" ("is_read");
CREATE INDEX IF NOT EXISTS "idx_messages_created_at" ON "messages" ("created_at");

-- Add foreign key constraints
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE NO ACTION;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE NO ACTION;
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE cascade ON UPDATE NO ACTION;
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE NO ACTION;
