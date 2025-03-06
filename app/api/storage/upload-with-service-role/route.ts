import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('API: Processing service role upload request');

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
    
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucketName = formData.get('bucket') as string;
    const filePath = formData.get('path') as string;
    
    // Validate required params
    if (!file || !bucketName || !filePath) {
      console.error('API: Missing required parameters for service role upload', { 
        hasFile: !!file, 
        hasBucket: !!bucketName, 
        hasPath: !!filePath 
      });
      
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    console.log(`API: Uploading file to ${bucketName}/${filePath} with service role`);
    
    // Upload the file using service role
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) {
      console.error('API: Service role upload failed:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    console.log('API: Service role upload successful:', publicUrl);
    
    return NextResponse.json({
      success: true,
      publicUrl,
    });
  } catch (error) {
    console.error('API: Error in upload-with-service-role endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during upload'
      },
      { status: 500 }
    );
  }
} 