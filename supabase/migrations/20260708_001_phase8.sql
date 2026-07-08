-- Migration 20260708_001_phase8.sql
-- Add new user status values, referral system columns, and business_inquiries table.

-- 1. Update user_status enum
ALTER TYPE public.user_status RENAME TO user_status_old;
CREATE TYPE public.user_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

ALTER TABLE profiles ALTER COLUMN status DROP DEFAULT;

ALTER TABLE profiles ALTER COLUMN status TYPE public.user_status USING (
  CASE status::text
    WHEN 'active' THEN 'approved'::public.user_status
    WHEN 'blacklisted' THEN 'suspended'::public.user_status
    ELSE status::text::public.user_status
  END
);

ALTER TABLE profiles ALTER COLUMN status SET DEFAULT 'pending'::public.user_status;
DROP TYPE user_status_old;

-- 2. Referral columns already exist (referral_code, referred_by_id) in profiles table.

-- 3. Create inquiry_status enum
CREATE TYPE public.inquiry_status AS ENUM ('new', 'contacted', 'qualified', 'closed');

-- 4. Create business_inquiries table
CREATE TABLE public.business_inquiries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name text NOT NULL,
    contact_name text NOT NULL,
    email text NOT NULL,
    website text,
    project_description text NOT NULL,
    status public.inquiry_status NOT NULL DEFAULT 'new'::public.inquiry_status,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Add RLS to business_inquiries
ALTER TABLE public.business_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can insert into business_inquiries (public endpoint for landing page)
CREATE POLICY "Public can insert inquiries" ON public.business_inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read/update business_inquiries
CREATE POLICY "Admins can manage inquiries" ON public.business_inquiries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  );

-- 6. Trigger to unlock referral bonus when first assignment is approved
CREATE OR REPLACE FUNCTION public.unlock_referral_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_id UUID;
BEGIN
  -- Only trigger when an assignment transitions to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Check if this user was referred and the bonus is still pending
    SELECT id INTO v_referral_id
    FROM public.referrals
    WHERE referred_id = NEW.profile_id
      AND bonus_status = 'pending'
    LIMIT 1;

    IF v_referral_id IS NOT NULL THEN
      -- Unlock the bonus
      UPDATE public.referrals
      SET bonus_status = 'awarded',
          unlocking_assignment_id = NEW.id,
          awarded_at = NOW()
      WHERE id = v_referral_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assignments_unlock_referral ON public.assignments;
CREATE TRIGGER trg_assignments_unlock_referral
  AFTER UPDATE OF status ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.unlock_referral_bonus();
