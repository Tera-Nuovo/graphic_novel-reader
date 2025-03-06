import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { requiredBuckets } from '@/lib/storage-utils';

export async function GET() {
  try {
    console.log('API: Automatically ensuring storage buckets exist...');
    
    // Create a Supabase client with admin role for proper permissions
    const supabase = createRouteHandlerClient(
      { cookies },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    );
    
    // Get existing buckets
    console.log('API: Listing existing buckets...');
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('API: Error listing buckets:', listError);
      return NextResponse.json(
        { success: false, error: 'Failed to list buckets', details: listError },
        { status: 500 }
      );
    }
    
    console.log('API: Existing buckets:', existingBuckets?.map(b => b.name) || []);
    
    // Extract bucket names from the list
    const existingBucketNames = existingBuckets?.map(bucket => bucket.name) || [];
    
    // Check which required buckets are missing
    const missingBuckets = requiredBuckets.filter(
      bucketName => !existingBucketNames.includes(bucketName)
    );
    
    console.log('API: Missing buckets that need creation:', missingBuckets);
    
    const results = [];
    
    // Create missing buckets
    for (const bucketName of missingBuckets) {
      console.log(`API: Creating bucket: ${bucketName}`);
      
      try {
        // Create the bucket with public flag
        const { data, error } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024 // 5MB limit
        });
        
        if (error) {
          console.error(`API: Error creating bucket ${bucketName}:`, error);
          results.push({
            bucket: bucketName,
            success: false,
            error: error
          });
        } else {
          console.log(`API: Successfully created bucket: ${bucketName}`);
          
          // Ensure bucket is public by updating its settings
          const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
            public: true
          });
          
          if (updateError) {
            console.error(`API: Error setting bucket ${bucketName} to public:`, updateError);
            results.push({
              bucket: bucketName,
              success: false,
              error: updateError
            });
          } else {
            results.push({
              bucket: bucketName,
              success: true
            });
          }
        }
      } catch (createError) {
        console.error(`API: Exception while creating bucket ${bucketName}:`, createError);
        results.push({
          bucket: bucketName,
          success: false,
          error: createError
        });
      }
    }
    
    // Also ensure existing buckets are public
    for (const bucketName of existingBucketNames.filter(bn => requiredBuckets.includes(bn))) {
      try {
        console.log(`API: Ensuring existing bucket ${bucketName} is public`);
        const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
          public: true
        });
        
        if (updateError) {
          console.error(`API: Error updating existing bucket ${bucketName}:`, updateError);
        } else {
          console.log(`API: Successfully updated bucket ${bucketName} to be public`);
        }
      } catch (error) {
        console.error(`API: Exception updating bucket ${bucketName}:`, error);
      }
    }
    
    const allSuccessful = results.every(result => result.success);
    
    return NextResponse.json({
      success: allSuccessful || existingBucketNames.length === requiredBuckets.length,
      existingBuckets: existingBucketNames,
      missingBuckets,
      results
    });
  } catch (error) {
    console.error('API: Error in ensure-buckets endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to ensure buckets exist', details: error },
      { status: 500 }
    );
  }
} 