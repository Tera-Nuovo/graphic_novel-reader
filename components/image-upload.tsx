"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Trash2, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { toast } from "./ui/use-toast"

// Simple function to generate a unique filename
const generateUniqueId = () => {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
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

export function ImageUpload({
  initialImage,
  bucketName,
  folderPath,
  onImageUploaded,
  aspectRatio = "1/1",
  maxWidth = 800,
  maxHeight = 800,
}: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImage || null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialImage) {
      setImageUrl(initialImage)
    }
  }, [initialImage])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files

    if (!files || files.length === 0) {
      return
    }

    const file = files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `${folderPath}/${generateUniqueId()}.${fileExt}`
    const filePath = `${bucketName}/${fileName}`

    // Check file size
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    // Check file type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid image (JPEG, PNG, WebP, or GIF)",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)

      // Resize image before upload if it's too large
      let fileToUpload = file
      if (file.size > 1 * 1024 * 1024) { // Resize if larger than 1MB
        fileToUpload = await resizeImage(file, maxWidth, maxHeight)
      }

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw uploadError
      }

      // Get the public URL
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      const publicUrl = data.publicUrl
      
      setImageUrl(publicUrl)
      onImageUploaded(publicUrl)
      
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully",
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      // Clear the input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    if (!imageUrl) return
    
    // Extract filename from URL
    const parts = imageUrl.split('/')
    const fileName = parts[parts.length - 1]
    const fullPath = `${folderPath}/${fileName}`
    
    try {
      // Delete from Supabase storage
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fullPath])
      
      if (error) {
        throw error
      }
      
      setImageUrl(null)
      onImageUploaded('')
      
      toast({
        title: "Image removed",
        description: "The image has been removed",
      })
    } catch (error) {
      console.error('Error removing image:', error)
      toast({
        title: "Remove failed",
        description: "There was an error removing the image",
        variant: "destructive",
      })
    }
  }

  // Function to resize image
  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (readerEvent) => {
        const image = new Image()
        image.onload = () => {
          // Calculate new dimensions
          let width = image.width
          let height = image.height
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
          
          // Create canvas and resize
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(image, 0, 0, width, height)
            
            // Convert to blob/file
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Canvas to Blob conversion failed'))
                return
              }
              
              // Use a type assertion to create the File object
              const newFile = new File([blob] as BlobPart[], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
              
              resolve(newFile)
            }, file.type, 0.85) // Quality parameter (0.85 = 85% quality)
          } else {
            reject(new Error('Could not get canvas context'))
          }
        }
        
        image.onerror = () => {
          reject(new Error('Failed to load image'))
        }
        
        if (readerEvent.target?.result) {
          image.src = readerEvent.target.result as string
        } else {
          reject(new Error('Failed to read file data'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsDataURL(file)
    })
  }

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      
      <div 
        className={`border-2 border-dashed rounded-md p-4 ${
          uploading ? 'opacity-50' : ''
        }`}
        style={{ aspectRatio }}
      >
        {imageUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={imageUrl}
              alt="Uploaded image"
              fill
              className="object-cover rounded-md"
            />
            <div className="absolute bottom-2 right-2 flex gap-2">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm"
                onClick={handleUploadClick}
                disabled={uploading}
              >
                <Upload className="h-4 w-4" />
                <span className="sr-only">Change image</span>
              </Button>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="bg-destructive/80 backdrop-blur-sm"
                onClick={handleRemove}
                disabled={uploading}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove image</span>
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="flex flex-col items-center justify-center h-full cursor-pointer"
            onClick={handleUploadClick}
          >
            {uploading ? (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 