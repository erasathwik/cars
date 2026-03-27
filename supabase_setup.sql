-- CARS (Campus Asset Recovery System) Supabase Schema Setup

-- 1. Create the Users Table
-- This table automatically links to Supabase auth.users via the id column
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  roll_number TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  mobile_number TEXT NOT NULL,
  branch TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security) on the users table
-- For ease of development/access by our backend API we will allow all operations
-- In a strict prod environment you would limit this to service_role or current user
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow Service Role" ON public.users FOR ALL USING (true);


-- 2. Create the Items Table
CREATE TABLE public.items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  location_found TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'found' CHECK (status IN ('found', 'claimed', 'returned')),
  posted_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to items" ON public.items FOR SELECT USING (true);
CREATE POLICY "Allow insert/update for items" ON public.items FOR ALL USING (true);


-- 3. Create the Claims Table
CREATE TABLE public.claims (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  claimed_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  proof TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow operations on claims" ON public.claims FOR ALL USING (true);


-- 4. Enable Storage (You need to create a bucket named 'item-images')
-- Ensure 'item-images' is set to Public inside Supabase dashboard -> Storage.
-- This policy allows authenticated users to upload to the bucket
CREATE POLICY "Allow public uploads to item-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'item-images');
CREATE POLICY "Allow public read of item-images" ON storage.objects FOR SELECT USING (bucket_id = 'item-images');

-- Note: Ensure uuid extension is enabled (usually is by default in Supabase)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
