import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { requiredBuckets } from '@/lib/storage-utils';

export async function GET() {
  try {
    console.log('API: Creating storage buckets...');
    
    // Create a Supabase client with admin role
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
        { error: 'Failed to list buckets', details: listError },
        { status: 500 }
      );
    }
    
    console.log('API: Successfully listed buckets:', existingBuckets?.map(b => b.name) || []);
    
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
      console.log(`API: Attempting to create bucket: ${bucketName}`);
      
      try {
        const { data, error } = await supabase.storage.createBucket(bucketName, {
          public: true
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
          results.push({
            bucket: bucketName,
            success: true
          });
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
    
    return NextResponse.json({
      message: 'Storage bucket creation complete',
      existingBuckets: existingBucketNames,
      results
    });
  } catch (error) {
    console.error('API: Error in create-buckets endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to create buckets', details: error },
      { status: 500 }
    );
  }
} 