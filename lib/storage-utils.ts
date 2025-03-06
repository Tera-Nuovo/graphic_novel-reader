import { supabase } from './supabase';

export const requiredBuckets = ['stories', 'panels'];

/**
 * Ensures that all required storage buckets exist in Supabase
 * Creates them if they don't exist
 */
export async function ensureStorageBuckets(): Promise<boolean> {
  console.log('Starting to check and create necessary storage buckets...');
  
  try {
    // Get existing buckets
    console.log('Listing existing buckets...');
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      console.error('Full error object:', JSON.stringify(listError, null, 2));
      return false;
    }
    
    console.log('Successfully listed buckets:', existingBuckets?.map(b => b.name) || []);
    
    // Extract bucket names from the list
    const existingBucketNames = existingBuckets?.map(bucket => bucket.name) || [];
    
    // Check which required buckets are missing
    const missingBuckets = requiredBuckets.filter(
      bucketName => !existingBucketNames.includes(bucketName)
    );
    
    console.log('Missing buckets that need creation:', missingBuckets);
    
    let allSuccessful = true;
    
    // Create missing buckets
    for (const bucketName of missingBuckets) {
      console.log(`Attempting to create bucket: ${bucketName}`);
      
      try {
        const { data, error } = await supabase.storage.createBucket(bucketName, {
          public: true
        });
        
        if (error) {
          console.error(`Error creating bucket ${bucketName}:`, error);
          console.error('Full error object:', JSON.stringify(error, null, 2));
          allSuccessful = false;
        } else {
          console.log(`Successfully created bucket: ${bucketName}`, data);
          
          // Set bucket to public
          console.log(`Setting bucket ${bucketName} to public...`);
          try {
            const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl('test');
            console.log(`Successfully set bucket ${bucketName} to public`);
          } catch (publicUrlError) {
            console.error(`Error setting bucket ${bucketName} to public:`, publicUrlError);
            allSuccessful = false;
          }
        }
      } catch (createError) {
        console.error(`Exception while creating bucket ${bucketName}:`, createError);
        allSuccessful = false;
      }
    }
    
    console.log('Storage buckets check complete. All successful:', allSuccessful);
    return allSuccessful;
  } catch (error) {
    console.error('Error ensuring storage buckets:', error);
    return false;
  }
} 