-- Add Address, State, Mobile fields to contact_submissions for the new
-- contact form. The table already has `phone` so we add `address`,
-- `state`, and `mobile` (mobile is required and stored separately so the
-- form is explicit; `phone` stays for backwards compatibility).

ALTER TABLE contact_submissions
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS state   TEXT,
  ADD COLUMN IF NOT EXISTS mobile  TEXT;
