-- M17: store required_by as a first-class column on quote_requests
-- (was previously buried in custom_requirements text, so email "Required By" was empty)
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS required_by DATE;
