import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requiredBuckets } from '@/lib/storage-utils';

/**
 * Direct approach to set up storage without relying on stored procedures
 */
export async function GET() {
  try {
    console.log('API: Direct policy setup for buckets');
    
    // Create a Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          persistSession: false,
        }
      }
    );
    
    // Check that buckets exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      return NextResponse.json(
        { success: false, error: 'Failed to list buckets', details: bucketsError },
        { status: 500 }
      );
    }
    
    // Create any missing buckets
    const existingBucketNames = buckets?.map(b => b.name) || [];
    const missingBuckets = requiredBuckets.filter(name => !existingBucketNames.includes(name));
    
    // Create missing buckets
    for (const bucketName of missingBuckets) {
      try {
        await supabase.storage.createBucket(bucketName, { public: true });
        console.log(`Created bucket: ${bucketName}`);
      } catch (error) {
        console.error(`Error creating bucket ${bucketName}:`, error);
      }
    }
    
    // Update existing buckets to ensure they're public
    for (const bucketName of requiredBuckets) {
      try {
        await supabase.storage.updateBucket(bucketName, { public: true });
        console.log(`Updated bucket to public: ${bucketName}`);
      } catch (error) {
        console.error(`Error updating bucket ${bucketName}:`, error);
      }
    }
    
    // Execute SQL to set up policies directly
    try {
      const sql = `
        -- Enable RLS on storage.objects
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

        -- Create policy for authenticated users to insert objects
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'objects' 
            AND schemaname = 'storage' 
            AND policyname = 'authenticated_insert'
          ) THEN
            CREATE POLICY authenticated_insert ON storage.objects
              FOR INSERT 
              WITH CHECK (auth.role() = 'authenticated');
          END IF;
        END
        $$;

        -- Create policy for public read access
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'objects' 
            AND schemaname = 'storage' 
            AND policyname = 'public_read'
          ) THEN
            CREATE POLICY public_read ON storage.objects
              FOR SELECT 
              USING (true);
          END IF;
        END
        $$;

        -- Create policy for authenticated users to update their objects
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'objects' 
            AND schemaname = 'storage' 
            AND policyname = 'authenticated_update'
          ) THEN
            CREATE POLICY authenticated_update ON storage.objects
              FOR UPDATE 
              USING (auth.role() = 'authenticated');
          END IF;
        END
        $$;

        -- Create policy for authenticated users to delete objects
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'objects' 
            AND schemaname = 'storage' 
            AND policyname = 'authenticated_delete'
          ) THEN
            CREATE POLICY authenticated_delete ON storage.objects
              FOR DELETE 
              USING (auth.role() = 'authenticated');
          END IF;
        END
        $$;
      `;
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        // If the RPC fails, it's likely that the exec_sql function doesn't exist
        console.error('Failed to execute SQL directly:', error);
        
        return NextResponse.json({
          success: true,
          message: "Set buckets to public. For RLS policies, please configure them manually in Supabase.",
          manualInstructions: true
        });
      }
      
      return NextResponse.json({
        success: true,
        message: "Successfully set up buckets and configured RLS policies."
      });
      
    } catch (sqlError) {
      console.error('Error executing SQL:', sqlError);
      
      // Consider this partially successful if the buckets are public
      return NextResponse.json({
        success: true,
        message: "Set buckets to public. For RLS policies, please configure them manually in Supabase.",
        manualInstructions: true,
        error: sqlError
      });
    }
    
  } catch (error) {
    console.error('Error in direct-policy-setup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set up policies', details: error },
      { status: 500 }
    );
  }
} 