import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { requiredBuckets } from '@/lib/storage-utils';

export async function GET() {
  try {
    console.log('API: Configuring storage bucket policies...');
    
    // Create a Supabase client with admin role for proper permissions
    const supabase = createRouteHandlerClient(
      { cookies },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY, // Service role key required for policy management
      }
    );
    
    // Ensure buckets exist first
    const bucketResponse = await fetch(new URL('/api/storage/ensure-buckets', new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000')));
    const bucketData = await bucketResponse.json();
    
    if (!bucketResponse.ok || !bucketData.success) {
      console.error('API: Failed to ensure buckets exist before configuring policies:', bucketData);
      return NextResponse.json(
        { success: false, error: 'Failed to ensure buckets exist', details: bucketData },
        { status: 500 }
      );
    }
    
    const results = [];
    
    // Configure policies for each bucket
    for (const bucketName of requiredBuckets) {
      console.log(`API: Configuring policies for bucket: ${bucketName}`);
      
      try {
        // First, we need to get the bucket ID
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          throw bucketsError;
        }
        
        const bucket = buckets?.find(b => b.name === bucketName);
        if (!bucket) {
          throw new Error(`Bucket ${bucketName} not found`);
        }
        
        // Create a policy that allows all authenticated users to upload files
        const uploadPolicyName = `${bucketName}_upload_policy`;
        
        // Using raw SQL since the Supabase JS client doesn't have methods for managing storage policies
        const { error: createPolicyError } = await supabase.rpc('create_storage_policy', {
          bucket_name: bucketName,
          policy_name: uploadPolicyName,
          definition: `(bucket_id = '${bucket.id}' AND auth.role() = 'authenticated')`,
          operation: 'INSERT'
        });
        
        if (createPolicyError) {
          // If policy already exists, this might fail, but that's okay
          console.warn(`API: Error creating upload policy for ${bucketName}:`, createPolicyError);
        }
        
        // Create a policy for reading files (public read)
        const readPolicyName = `${bucketName}_read_policy`;
        
        const { error: readPolicyError } = await supabase.rpc('create_storage_policy', {
          bucket_name: bucketName,
          policy_name: readPolicyName,
          definition: `(bucket_id = '${bucket.id}')`, // Allow anyone to read
          operation: 'SELECT'
        });
        
        if (readPolicyError) {
          console.warn(`API: Error creating read policy for ${bucketName}:`, readPolicyError);
        }
        
        // Create a policy for updating files
        const updatePolicyName = `${bucketName}_update_policy`;
        
        const { error: updatePolicyError } = await supabase.rpc('create_storage_policy', {
          bucket_name: bucketName,
          policy_name: updatePolicyName,
          definition: `(bucket_id = '${bucket.id}' AND auth.role() = 'authenticated')`,
          operation: 'UPDATE'
        });
        
        if (updatePolicyError) {
          console.warn(`API: Error creating update policy for ${bucketName}:`, updatePolicyError);
        }
        
        // Create a policy for deleting files
        const deletePolicyName = `${bucketName}_delete_policy`;
        
        const { error: deletePolicyError } = await supabase.rpc('create_storage_policy', {
          bucket_name: bucketName,
          policy_name: deletePolicyName,
          definition: `(bucket_id = '${bucket.id}' AND auth.role() = 'authenticated')`,
          operation: 'DELETE'
        });
        
        if (deletePolicyError) {
          console.warn(`API: Error creating delete policy for ${bucketName}:`, deletePolicyError);
        }
        
        results.push({
          bucket: bucketName,
          success: true,
          policies: [
            { name: uploadPolicyName, operation: 'INSERT', error: createPolicyError ? createPolicyError.message : null },
            { name: readPolicyName, operation: 'SELECT', error: readPolicyError ? readPolicyError.message : null },
            { name: updatePolicyName, operation: 'UPDATE', error: updatePolicyError ? updatePolicyError.message : null },
            { name: deletePolicyName, operation: 'DELETE', error: deletePolicyError ? deletePolicyError.message : null }
          ]
        });
        
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