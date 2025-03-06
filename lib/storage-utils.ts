import { supabase } from './supabase';

export const requiredBuckets = ['stories', 'panels'];

/**
 * Ensures that all required storage buckets exist in Supabase
 * Creates them if they don't exist
 */
export async function ensureStorageBuckets(): Promise<void> {
  try {
    // Get existing buckets
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    // Extract bucket names from the list
    const existingBucketNames = existingBuckets.map(bucket => bucket.name);
    
    // Check which required buckets are missing
    const missingBuckets = requiredBuckets.filter(
      bucketName => !existingBucketNames.includes(bucketName)
    );
    
    // Create missing buckets
    for (const bucketName of missingBuckets) {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
      });
      
      if (error) {
        console.error(`Error creating bucket ${bucketName}:`, error);
      } else {
        console.log(`Created bucket: ${bucketName}`);
      }
    }
    
    console.log('Storage buckets check complete');
  } catch (error) {
    console.error('Error ensuring storage buckets:', error);
  }
} 