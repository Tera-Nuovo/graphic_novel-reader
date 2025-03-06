import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requiredBuckets } from '@/lib/storage-utils';

export async function GET() {
  try {
    console.log('API: Configuring storage bucket policies...');
    
    // Create a Supabase client with admin role for proper permissions
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          persistSession: false,
        }
      }
    );
    
    // First check that buckets exist
    console.log('API: Verifying buckets exist before configuring policies');
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('API: Error listing buckets:', listError);
      return NextResponse.json(
        { success: false, error: 'Failed to list buckets', details: listError },
        { status: 500 }
      );
    }
    
    // Extract bucket names from the list
    const existingBucketNames = existingBuckets?.map(bucket => bucket.name) || [];
    
    // Check if all required buckets exist
    const missingBuckets = requiredBuckets.filter(
      bucketName => !existingBucketNames.includes(bucketName)
    );
    
    if (missingBuckets.length > 0) {
      console.error('API: Cannot configure policies - some buckets are missing:', missingBuckets);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot configure policies for non-existent buckets',
          missingBuckets 
        },
        { status: 400 }
      );
    }
    
    const results = [];
    
    // Configure policies for each bucket
    for (const bucketName of requiredBuckets) {
      console.log(`API: Configuring policies for bucket: ${bucketName}`);
      
      try {
        // First, we need to get the bucket ID
        const bucket = existingBuckets?.find(b => b.name === bucketName);
        if (!bucket) {
          throw new Error(`Bucket ${bucketName} not found`);
        }
        
        // Execute SQL to enable row-level security on the bucket
        const { error: rpcError } = await supabase
          .rpc('enable_bucket_public_access', { bucket_name: bucketName });
          
        if (rpcError) {
          console.error(`API: Error configuring access for ${bucketName}:`, rpcError);
          results.push({
            bucket: bucketName,
            success: false,
            error: rpcError
          });
        } else {
          console.log(`API: Successfully configured access for ${bucketName}`);
          results.push({
            bucket: bucketName,
            success: true
          });
        }
      } catch (error) {
        console.error(`API: Exception while configuring policies for bucket ${bucketName}:`, error);
        results.push({
          bucket: bucketName,
          success: false,
          error: error
        });
      }
    }
    
    const allSuccessful = results.every(result => result.success);
    
    return NextResponse.json({
      success: allSuccessful,
      results
    });
  } catch (error) {
    console.error('API: Error in configure-policies endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to configure bucket policies', details: error },
      { status: 500 }
    );
  }
} 