-- Phase 10: Notifications Error Tracking and Channel
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'discord';
