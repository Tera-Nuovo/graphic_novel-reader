"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useEnsureBuckets } from "@/lib/hooks/use-ensure-buckets"

/**
 * Helper function to upload files using the service role API
 * For cases where normal RLS policies fail
 */
const uploadWithServiceRole = async (file: File, bucket: string, path: string) => {
  try {
    // Call our API endpoint to handle the upload with service role key
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    formData.append('path', path);
    
    const response = await fetch('/api/storage/upload-with-service-role', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload with service role');
    }
    
    const data = await response.json();
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading with service role:', error);
    throw error;
  }
};

/**
 * Generate a unique ID for filenames based on timestamp and random string
 */
const generateUniqueId = () => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

interface ImageUploadProps {
  initialImage?: string | null
  bucketName: string
  folderPath: string
  onImageUploaded: (imageUrl: string) => void
  aspectRatio?: string
  maxWidth?: number
  maxHeight?: number
}

/**
 * A reusable image upload component that handles file validation,
 * image preview, and upload to Supabase storage
 */
export function ImageUpload({
  initialImage,
  bucketName,
  folderPath,
  onImageUploaded,
  aspectRatio = "1/1",
  maxWidth = 800,
  maxHeight = 800,
}: ImageUploadProps) {
  const [image, setImage] = useState<string | null>(initialImage || null)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { ensureBuckets, isEnsuring, bucketStatus } = useEnsureBuckets()

  // Handle upload click
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(selectedFile.type)) {
      setError("Please select a valid image file (JPEG, PNG, GIF, or WEBP)")
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file (JPEG, PNG, GIF, or WEBP)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB")
      toast({
        title: "File too large",
        description: "File size must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
    const imageUrl = URL.createObjectURL(selectedFile)
    setImage(imageUrl)
    setError(null)

    // Auto-upload when file is selected
    try {
      await uploadImage(selectedFile)
    } catch (error) {
      console.error("Error auto-uploading image:", error)
    }
  }

  // Upload image to Supabase storage
  const uploadImage = async (imageFile: File) => {
    if (!imageFile) return;

    try {
      setIsUploading(true);
      setError(null);

      // First, ensure buckets exist and policies are configured
      const bucketsReady = await ensureBuckets(true);
      
      // Don't throw immediately on bucket issues, we'll try service role upload
      if (!bucketsReady && bucketStatus.error) {
        console.warn(`Storage not fully configured: ${bucketStatus.error}. Will attempt service role upload.`);
      }

      // Resize image if needed
      const resizedImage = await resizeImage(imageFile, maxWidth, maxHeight);
      
      // Generate a unique filename
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${generateUniqueId()}.${fileExt}`;
      const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

      // Even if buckets aren't fully ready, let's try normal upload first 
      // if the buckets at least exist
      let uploadSuccess = false;
      
      if (bucketStatus.exists) {
        try {
          // Attempt normal client upload first
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, resizedImage, {
              cacheControl: "3600",
              upsert: true,
            });

          if (error) {
            // Check if error is RLS related
            if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
              console.warn('RLS error detected, will try service role upload');
            } else {
              throw error;
            }
          } else {
            // Success with normal client
            const { data: { publicUrl } } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);

            setImage(publicUrl);
            onImageUploaded(publicUrl);

            toast({
              title: "Image uploaded",
              description: "Your image has been uploaded successfully",
            });
            
            uploadSuccess = true;
          }
        } catch (uploadError) {
          console.error('Normal upload failed:', uploadError);
          // Continue to service role upload
        }
      }
      
      // If normal upload didn't succeed, try service role
      if (!uploadSuccess) {
        const publicUrl = await uploadWithServiceRole(resizedImage, bucketName, filePath);
        setImage(publicUrl);
        onImageUploaded(publicUrl);
        
        toast({
          title: "Image uploaded",
          description: "Your image has been uploaded successfully (with admin privileges)",
        });
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      setError(error.message || "Error uploading image");
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }

  // Handle image removal
  const handleRemove = async () => {
    try {
      setIsUploading(true)
      
      // If there's an image URL, try to delete the file from storage
      if (image && image.includes(bucketName)) {
        // Extract the path from the URL
        const path = image.split(`${bucketName}/`)[1]
        if (path) {
          await supabase.storage.from(bucketName).remove([path])
        }
      }
      
      setImage(null)
      setFile(null)
      onImageUploaded("")
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error removing image:", error)
    } finally {
      setIsUploading(false)
    }
  }

  /**
   * Resize an image file to specified dimensions while maintaining aspect ratio
   */
  const resizeImage = async (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
    const createImage = (url: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
      })

    const resize = async (img: HTMLImageElement, width: number, height: number): Promise<Blob> => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not create canvas context')
      
      ctx.drawImage(img, 0, 0, width, height)
      
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'))
              return
            }
            resolve(blob)
          },
          file.type,
          0.9 // Quality
        )
      })
    }

    const calculateDimensions = (originalWidth: number, originalHeight: number): { width: number; height: number } => {
      let width = originalWidth
      let height = originalHeight
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }
      
      return { width: Math.round(width), height: Math.round(height) }
    }

    try {
      const img = await createImage(URL.createObjectURL(file))
      const dimensions = calculateDimensions(img.width, img.height)
      const blob = await resize(img, dimensions.width, dimensions.height)
      
      // Create a new File with explicit type
      return new File(
        [blob], 
        file.name, 
        { type: file.type, lastModified: Date.now() }
      ) as File
    } catch (error) {
      console.error('Error resizing image:', error)
      return file
    }
  }

  return (
    <div>
      <div
        className="relative mt-2 overflow-hidden rounded-md border border-input bg-background"
        style={{ aspectRatio: aspectRatio }}
      >
        {/* Image Preview */}
        {image ? (
          <div className="relative h-full w-full">
            <img
              src={image}
              alt="Upload preview"
              className="h-full w-full object-cover"
            />
            {!isUploading && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6 rounded-full"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          // Upload Placeholder
          <div
            className="flex h-full w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed"
            onClick={handleUploadClick}
          >
            {isUploading || isEnsuring ? (
              <div className="flex flex-col items-center justify-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isEnsuring ? "Preparing storage..." : "Uploading..."}
                </p>
              </div>
            ) : (
              <>
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading || isEnsuring}
      />
    </div>
  )
} 