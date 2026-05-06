-- Quote Requests Table
CREATE TABLE quote_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  product_type TEXT,
  quantity INTEGER,
  custom_requirements TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'replied', 'converted')),
  notes TEXT
);

-- Contact Submissions Table
CREATE TABLE contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'replied'))
);

-- Enquiries Table
CREATE TABLE enquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  product_name TEXT,
  quantity INTEGER,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'replied'))
);

-- Enable Row Level Security
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (for now - forms need to insert)
CREATE POLICY "Allow public inserts quote_requests" ON quote_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public inserts contact_submissions" ON contact_submissions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public inserts enquiries" ON enquiries FOR INSERT TO anon WITH CHECK (true);

-- Admin read policy (authenticated users only)
CREATE POLICY "Admin read quote_requests" ON quote_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin read contact_submissions" ON contact_submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin read enquiries" ON enquiries FOR SELECT TO authenticated USING (true);
