-- Function to handle enabling public access to a bucket by setting appropriate RLS policies
CREATE OR REPLACE FUNCTION enable_bucket_public_access(bucket_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with the privileges of the function creator
AS $$
DECLARE
  bucket_id uuid;
BEGIN
  -- Get the bucket ID
  SELECT id INTO bucket_id FROM storage.buckets WHERE name = bucket_name;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bucket % not found', bucket_name;
  END IF;
  
  -- Update the bucket to be public
  UPDATE storage.buckets 
  SET public = true 
  WHERE id = bucket_id;
  
  -- Drop existing policies if they exist
  BEGIN
    DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
    DROP POLICY IF EXISTS bucket_select_policy ON storage.objects;
    DROP POLICY IF EXISTS bucket_insert_policy ON storage.objects;
    DROP POLICY IF EXISTS bucket_update_policy ON storage.objects;
    DROP POLICY IF EXISTS bucket_delete_policy ON storage.objects;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors when dropping policies - they may not exist
  END;
  
  -- Create policies for specific bucket
  -- Public READ policy
  CREATE POLICY bucket_select_policy ON storage.objects
    FOR SELECT USING (bucket_id = bucket_id);
  
  -- Authenticated INSERT policy
  CREATE POLICY bucket_insert_policy ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = bucket_id AND 
      auth.role() = 'authenticated'
    );
  
  -- Authenticated UPDATE policy
  CREATE POLICY bucket_update_policy ON storage.objects
    FOR UPDATE USING (
      bucket_id = bucket_id AND 
      auth.role() = 'authenticated'
    );
  
  -- Authenticated DELETE policy
  CREATE POLICY bucket_delete_policy ON storage.objects
    FOR DELETE USING (
      bucket_id = bucket_id AND 
      auth.role() = 'authenticated'
    );
    
  -- Enable RLS on objects table
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
END;
$$; 